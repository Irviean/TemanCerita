const express = require('express'); // Mengimpor framework Express untuk mempermudah pembuatan server web
const cors = require('cors'); // Mengimpor middleware CORS agar aplikasi frontend (misal: port 3000) bisa mengakses server ini
const fs = require('fs'); // Mengimpor modul File System bawaan Node.js untuk berinteraksi dengan file di komputer
const path = require('path'); // Mengimpor modul Path untuk mengelola jalur (path) file dengan benar

const app = express(); // Membuat aplikasi Express (pusat dari server kita)
const PORT = 5000; // Menentukan nomor port server (seperti alamat pintu masuk untuk request)

// Konfigurasi Middleware
app.use(cors()); // Mengaktifkan CORS agar browser mengizinkan request dari asal yang berbeda
app.use(express.json()); // Memberitahu Express agar bisa membaca data JSON yang dikirim dalam request body

// Menampilkan file frontend (HTML, CSS, JS) secara otomatis
// Karena file HTML ada di luar folder backend-teman-cerita, kita mundur satu folder (../)
app.use(express.static(path.join(__dirname, '../')));
console.log("Static files served from:", path.join(__dirname, '../'));

// Fungsi pembantu (helper) untuk membaca data dari file data.json
const getDatabase = () => {
    const filePath = path.join(__dirname, 'data.json'); // Mencari lokasi pasti file data.json di folder saat ini
    const dataRaw = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : JSON.stringify({ mahasiswa: [], konselor: [], bookings: [], riwayat: [], artikel: [], jadwal_konselor: [], notifications: [], statistik_performa: {}, chats: [], payments: [], surveys: [], kontak_messages: [] }, null, 2); // Membaca isi file secara utuh sebagai teks (string)
    return JSON.parse(dataRaw); // Mengubah teks tersebut menjadi objek JavaScript agar bisa diambil datanya
};

// Fungsi pembantu untuk menyimpan kembali data ke data.json
const saveDatabase = (data) => {
    const filePath = path.join(__dirname, 'data.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8'); // Menulis objek ke file dengan format rapi (indentasi 2)
};

// Endpoint POST: Login (Mahasiswa & Konselor)
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password, role } = req.body;
        const db = getDatabase();
        
        const user = (role === 'konselor' ? db.konselor : db.mahasiswa)
            .find(u => u.email === email && u.password === password); // Password tidak di-hash untuk kesederhanaan

        if (user) {
            res.json({ message: 'Login berhasil', user });
        } else {
            res.status(401).json({ error: 'Email atau password salah' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Gagal login' });
    }
});

// Endpoint POST: Register
app.post('/api/auth/register', (req, res) => {
    try {
        const db = getDatabase();
        const newUser = { 
            id: req.body.role === 'konselor' ? `k${Date.now()}` : `m${Date.now()}`,
            ...req.body 
        };

        // Tambahkan properti default untuk mahasiswa/konselor baru
        if (req.body.role === 'konselor') {
            newUser.tags = []; newUser.pendidikan = []; newUser.topik_keahlian = []; newUser.status = 'offline'; newUser.foto = 'https://via.placeholder.com/300'; newUser.harga = 0; newUser.bio = ''; newUser.rating = 0; newUser.jumlah_mahasiswa_ditangani = 0; newUser.peringkat = 99;
            db.konselor.push(newUser);
        }
        else db.mahasiswa.push(newUser);
        
        saveDatabase(db);
        res.status(201).json({ message: 'Registrasi berhasil', user: newUser });
    } catch (err) {
        res.status(500).json({ error: 'Gagal registrasi' });
    }
});

// Endpoint GET: Mengambil daftar semua konselor
app.get('/api/konselor', (req, res) => {
    try {
        const db = getDatabase();
        let konselorList = db.konselor;

        // Fitur Filter & Search
        if (req.query.spesialisasi) {
            konselorList = konselorList.filter(k => k.spesialisasi.toLowerCase().includes(req.query.spesialisasi.toLowerCase()));
        }
        if (req.query.minRating) {
            konselorList = konselorList.filter(k => k.rating >= parseFloat(req.query.minRating));
        }
        if (req.query.maxHarga) {
            konselorList = konselorList.filter(k => k.harga <= parseFloat(req.query.maxHarga));
        }
        if (req.query.mode) {
            // Filter konselor yang memiliki jadwal aktif untuk mode tertentu
            const konselorDenganJadwalAktif = db.jadwal_konselor.filter(j => j.aktif && j.mode.includes(req.query.mode));
            const konselorIdsAktif = Array.from(new Set(konselorDenganJadwalAktif.map(j => j.konselorId)));
            konselorList = konselorList.filter(k => konselorIdsAktif.includes(k.id));
        }
        if (req.query.search) {
            const searchTerm = req.query.search.toLowerCase();
            konselorList = konselorList.filter(k =>
                k.nama.toLowerCase().includes(searchTerm) ||
                k.spesialisasi.toLowerCase().includes(searchTerm) ||
                k.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        res.json(konselorList);
    } catch (err) {
        console.error('Error di /api/konselor:', err);
        res.status(500).json({ error: 'Gagal mengambil data konselor', details: err.message });
    }
});

// Endpoint GET: Mengambil detail konselor berdasarkan ID
app.get('/api/konselor/:id', (req, res) => {
    try {
        const db = getDatabase();
        const konselor = db.konselor.find(k => k.id === req.params.id);
        if (konselor) {
            res.json(konselor);
        } else {
            res.status(404).json({ error: 'Konselor tidak ditemukan' });
        }
    } catch (err) {
        console.error('Error di /api/konselor/:id:', err);
        res.status(500).json({ error: 'Gagal mengambil detail konselor', details: err.message });
    }
});

// Endpoint POST: Booking Sesi + Manajemen Beban Kerja
app.post('/api/booking', (req, res) => {
    try {
        const db = getDatabase();
        const { konselorId, tanggal, jam, mode, praKonseling } = req.body;

        // Validasi input
        if (!konselorId || !tanggal || !jam || !mode) {
            return res.status(400).json({ error: 'Data booking tidak lengkap.' });
        }

        // Logika Batasan Beban Kerja (Maks 5 mahasiswa per hari per konselor)
        const jumlahBooking = db.bookings.filter(b => b.konselorId === konselorId && b.tanggal === tanggal).length;
        if (jumlahBooking >= 5) {
            return res.status(400).json({ error: 'Jadwal konselor ini sudah penuh untuk tanggal tersebut.' });
        }
        const newBooking = { id: `b${Date.now()}`, ...req.body, status: 'Menunggu Persetujuan' }; // Default status
        db.bookings.push(newBooking);
        saveDatabase(db);

        res.status(201).json({ message: 'Booking berhasil dibuat', data: newBooking });
    } catch (err) {
        res.status(500).json({ error: 'Gagal membuat booking' });
    }
});

// Endpoint PUT: Mengubah status booking (Konselor)
app.put('/api/booking/:id/status', (req, res) => {
    try {
        const db = getDatabase();
        const { status } = req.body; // 'Dikonfirmasi', 'Ditolak', 'Selesai'
        const bookingId = req.params.id;

        const bookingIndex = db.bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) {
            return res.status(404).json({ error: 'Booking tidak ditemukan' });
        }

        db.bookings[bookingIndex].status = status;
        saveDatabase(db);
        res.json({ message: `Status booking ${bookingId} berhasil diperbarui menjadi ${status}`, data: db.bookings[bookingIndex] });
    } catch (err) {
        console.error('Error di /api/booking/:id/status:', err);
        res.status(500).json({ error: 'Gagal memperbarui status booking', details: err.message });
    }
});

// Endpoint GET: Mengambil daftar booking
app.get('/api/bookings', (req, res) => {
    try {
        const db = getDatabase();
        let result = db.bookings || [];

        if (req.query.id) {
            result = result.filter(b => b.id === req.query.id);
        }
        if (req.query.mahasiswaId) {
            result = result.filter(b => b.mahasiswaId === req.query.mahasiswaId);
        }
        if (req.query.konselorId) {
            result = result.filter(b => b.konselorId === req.query.konselorId);
        }
        if (req.query.status) {
            result = result.filter(b => b.status === req.query.status);
        }
        if (req.query.tanggal) {
            result = result.filter(b => b.tanggal === req.query.tanggal);
        }

        // Tambahkan informasi nama konselor/mahasiswa untuk kemudahan frontend
        result = result.map(b => {
            const k = db.konselor.find(kons => kons.id === b.konselorId);
            const m = db.mahasiswa.find(maha => maha.id === b.mahasiswaId);
            return { ...b, konselorNama: k?.nama, mahasiswaNama: m?.nama, mahasiswaProdi: m?.prodi };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil data booking' });
    }
});

// Endpoint POST: Kirim Review
app.post('/api/review', (req, res) => {
    try {
        const db = getDatabase();
        const { bookingId, konselorId, mahasiswaId, rating, reviewText } = req.body;
        if (!bookingId || !konselorId || !mahasiswaId || !rating) {
            return res.status(400).json({ error: 'Data review tidak lengkap.' });
        }
        const newReview = { id: `r${Date.now()}`, ...req.body, tanggal: new Date().toISOString().split('T')[0] }; // Status 'Selesai' diasumsikan dari konteks review
        db.riwayat.push(newReview);
        saveDatabase(db);

        res.json({ message: 'Ulasan berhasil dikirim' });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengirim ulasan' });
    }
});

// Endpoint PUT: Update Profil Mahasiswa
app.put('/api/profil', (req, res) => {
    try {
        const db = getDatabase();
        // Asumsi ada 1 mahasiswa yang login (m1)
        const mahasiswaId = req.body.id || 'm1'; // Ambil ID dari body, fallback ke m1
        const mahasiswaIndex = db.mahasiswa.findIndex(m => m.id === mahasiswaId);

        if (mahasiswaIndex > -1) {
            db.mahasiswa[mahasiswaIndex] = { ...db.mahasiswa[mahasiswaIndex], ...req.body };
            saveDatabase(db);
            res.json({ message: 'Profil berhasil diperbarui', data: db.mahasiswa[mahasiswaIndex] });
        } else {
            res.status(404).json({ error: 'Profil mahasiswa tidak ditemukan' });
        }
    } catch (err) {
        console.error('Error di /api/profil:', err);
        res.status(500).json({ error: 'Gagal memperbarui profil' });
    }
});

// Endpoint GET: Mengambil profil mahasiswa
app.get('/api/profil', (req, res) => {
    try {
        const db = getDatabase();
        const mahasiswa = db.mahasiswa && db.mahasiswa.length > 0 ? db.mahasiswa[0] : null;
        if (mahasiswa) {
            res.json(mahasiswa);
        } else {
            res.status(404).json({ error: 'Profil tidak ditemukan' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal mengambil profil' });
    }
});

// Endpoint GET: Riwayat Sesi
app.get('/api/riwayat', (req, res) => {
    try {
        const db = getDatabase();
        let riwayatList = db.riwayat;

        // Filter riwayat berdasarkan mahasiswaId atau konselorId jika ada
        const userId = req.query.userId; // Bisa mahasiswaId atau konselorId
        if (userId) {
            riwayatList = riwayatList.filter(r => r.mahasiswaId === userId || r.konselorId === userId);
        }
        if (req.query.status) {
            riwayatList = riwayatList.filter(r => r.status === req.query.status);
        }
        if (req.query.tanggal) {
            riwayatList = riwayatList.filter(r => r.tanggal === req.query.tanggal);
        }

        // Tambahkan detail konselor/mahasiswa ke riwayat
        riwayatList = riwayatList.map(r => {
            const konselor = db.konselor.find(k => k.id === r.konselorId);
            const mahasiswa = db.mahasiswa.find(m => m.id === r.mahasiswaId);
            return {
                ...r,
                konselor: konselor ? { id: konselor.id, nama: konselor.nama, foto: konselor.foto } : null,
                mahasiswa: mahasiswa ? { id: mahasiswa.id, nama: mahasiswa.nama, foto: mahasiswa.foto } : null
            };
        });
        res.json(riwayatList);
    } catch (err) {
        console.error('Error di /api/riwayat:', err);
        res.status(500).json({ error: 'Gagal mengambil riwayat', details: err.message });
    }
});

// Endpoint GET: Mengambil jadwal konselor spesifik
app.get('/api/jadwal/:konselorId', (req, res) => {
    try {
        const db = getDatabase();
        const jadwal = db.jadwal_konselor.filter(j => j.konselorId === req.params.konselorId);
        if (jadwal.length > 0) {
            res.json(jadwal);
        } else {
            res.status(404).json({ error: 'Jadwal konselor tidak ditemukan' });
        }
    } catch (err) {
        console.error('Error di /api/jadwal/:konselorId:', err);
        res.status(500).json({ error: 'Gagal mengambil jadwal konselor', details: err.message });
    }
});

// Endpoint PUT: Manajemen Jadwal Konselor
app.put('/api/jadwal', (req, res) => {
    try {
        let db = getDatabase();
        const { konselorId, jadwalUpdate } = req.body; // jadwalUpdate diharapkan array seperti di data.json
        if (!konselorId || !jadwalUpdate) {
            return res.status(400).json({ error: 'Data jadwal tidak lengkap.' });
        }
        // Pastikan jadwal_konselor adalah array
        if (!Array.isArray(db.jadwal_konselor)) db.jadwal_konselor = [];
        // Hapus jadwal lama untuk konselor ini, lalu tambahkan yang baru
        db.jadwal_konselor = db.jadwal_konselor.filter(j => j.konselorId !== konselorId);
        // Tambahkan jadwal baru
        db.jadwal_konselor.push(...jadwalUpdate.map(item => ({ ...item, konselorId })));

        saveDatabase(db);
        res.json({ message: 'Jadwal berhasil diperbarui', data: db.jadwal_konselor.filter(j => j.konselorId === konselorId) });
    } catch (err) {
        console.error('Error di /api/jadwal:', err);
        res.status(500).json({ error: 'Gagal memperbarui jadwal' });
    }
});

// Endpoint PUT: Menambah/Menghapus Konselor Favorit
app.put('/api/profil/favorite', (req, res) => {
    try {
        const db = getDatabase(); // Asumsi userId dikirim di body atau dari sesi
        const { userId, konselorId, action } = req.body; // action: 'add' atau 'remove'
        const mahasiswa = db.mahasiswa.find(m => m.id === userId);
        if (!mahasiswa) return res.status(404).json({ error: 'Mahasiswa tidak ditemukan' });
        if (action === 'add' && !mahasiswa.favoritKonselorIds.includes(konselorId)) mahasiswa.favoritKonselorIds.push(konselorId);
        else if (action === 'remove') mahasiswa.favoritKonselorIds = mahasiswa.favoritKonselorIds.filter(id => id !== konselorId); // Perbaikan: gunakan else if
        saveDatabase(db);
        res.json({ message: 'Daftar favorit berhasil diperbarui', data: mahasiswa.favoritKonselorIds });
    } catch (err) {
        res.status(500).json({ error: 'Gagal memperbarui favorit' });
    }
});

// Endpoint POST: Buat Artikel
app.post('/api/artikel', (req, res) => {
    try {
        const db = getDatabase();
        const { konselorId, judul, konten, coverImage, sumber, tags } = req.body;

        if (!konselorId || !judul || !konten) {
            return res.status(400).json({ error: 'Data artikel tidak lengkap.' });
        }

        const newArtikel = { id: `a${Date.now()}`, konselorId, judul, konten, coverImage, sumber, tags: tags || [], tanggal: new Date().toISOString() };
        db.artikel.push(newArtikel);
        saveDatabase(db);
        res.status(201).json({ message: 'Artikel berhasil diterbitkan' });
    } catch (err) {
        console.error('Error di /api/artikel (POST):', err);
        res.status(500).json({ error: 'Gagal membuat artikel' });
    }
});

// Endpoint GET: Mengambil daftar artikel
app.get('/api/artikel', (req, res) => {
    try {
        const db = getDatabase();
        let artikelList = db.artikel;
        if (req.query.konselorId) {
            artikelList = artikelList.filter(a => a.konselorId === req.query.konselorId);
        }
        res.json(artikelList);
    } catch (err) {
        console.error('Error di /api/artikel (GET):', err);
        res.status(500).json({ error: 'Gagal mengambil daftar artikel' });
    }
});

// Endpoint POST: Mengirim pesan chat (simulasi)
app.post('/api/chat/:sesiId/pesan', (req, res) => {
    try {
        const db = getDatabase();
        const { senderId, text } = req.body;
        const sesiId = req.params.sesiId;

        let chat = db.chats.find(c => c.sesiId === sesiId);
        if (!chat) {
            chat = { sesiId, messages: [] };
            db.chats.push(chat);
        }
        const newMessage = { id: `msg${Date.now()}`, senderId, text, timestamp: new Date().toISOString() };
        chat.messages.push(newMessage);
        saveDatabase(db);
        res.status(201).json({ message: 'Pesan terkirim', data: newMessage });
    } catch (err) {
        console.error('Error di /api/chat/:sesiId/pesan:', err);
        res.status(500).json({ error: 'Gagal mengirim pesan chat' });
    }
});

// Endpoint GET: Mengambil riwayat chat (simulasi)
app.get('/api/chat/:sesiId', (req, res) => {
    try {
        const db = getDatabase();
        const chat = db.chats.find(c => c.sesiId === req.params.sesiId);
        if (chat) {
            res.json(chat.messages);
        } else {
            res.status(404).json({ error: 'Riwayat chat tidak ditemukan' });
        }
    } catch (err) {
        console.error('Error di /api/chat/:sesiId:', err);
        res.status(500).json({ error: 'Gagal mengambil riwayat chat' });
    }
});

// Endpoint GET: Notifikasi
app.get('/api/notifications', (req, res) => {
    try {
        const db = getDatabase();
        let notifications = db.notifications;
        if (req.query.userId) {
            notifications = notifications.filter(n => n.userId === req.query.userId);
        }
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil notifikasi' });
    }
});

// Endpoint GET: Mengambil data statistik untuk grafik Chart.js
app.get('/api/statistik', (req, res) => {
    try {
        const db = getDatabase();
        // Jika ada query bulan, bisa filter performa_konselor atau data lain yang relevan
        if (req.query.bulan && db.statistik_performa.performa_konselor) {
            // Contoh sederhana: tidak ada data bulanan di data.json, jadi kembalikan semua
            // Untuk implementasi nyata, Anda akan memiliki data performa per bulan
            return res.json({ performa_konselor: db.statistik_performa.performa_konselor });
        }
        res.json(db.statistik_performa);
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil data statistik' }); // Mengirim pesan error 500 jika ada kesalahan internal
    }
});

// Endpoint POST: Menyimpan hasil survei kepuasan
app.post('/api/survey', (req, res) => {
    try {
        const db = getDatabase();
        const newSurvey = { id: `s${Date.now()}`, timestamp: new Date().toISOString(), ...req.body };
        db.surveys.push(newSurvey);
        saveDatabase(db);
        res.status(201).json({ message: 'Survei berhasil disimpan', data: newSurvey });
    } catch (err) {
        console.error('Error di /api/survey:', err);
        res.status(500).json({ error: 'Gagal menyimpan survei', details: err.message });
    }
});

// Endpoint POST: Mengirim pesan kontak
app.post('/api/kontak', (req, res) => {
    try {
        const db = getDatabase();
        const newMessage = { id: `msg${Date.now()}`, timestamp: new Date().toISOString(), ...req.body };
        db.kontak_messages.push(newMessage);
        saveDatabase(db);
        res.status(201).json({ message: 'Pesan kontak berhasil dikirim', data: newMessage });
    } catch (err) {
        console.error('Error di /api/kontak:', err);
        res.status(500).json({ error: 'Gagal mengirim pesan kontak', details: err.message });
    }
});

// Menjalankan server agar stand-by menunggu request
app.listen(PORT, () => {
    console.log(`Server Teman Cerita sedang berjalan di http://localhost:${PORT}`); // Menampilkan pesan di terminal saat server aktif
});