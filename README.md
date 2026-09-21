<p align="center">
  <img src="https://x.xcute.workers.dev/f/images/d461054bd06d.jpg" alt="Shorekeeper Bini Ran" width="100%">
</p>

# 🤖 Bot Discord

Bot Discord multifungsi berbasis Node.js dengan sistem plugin, dilengkapi fitur musik (menggunakan Deno), economy, gacha, pokemon, leveling, canvas, downloader, AI chat, dan masih banyak lagi.

---

## 📑 Daftar Isi

- [Fitur](#-fitur)
- [Requirements](#-requirements)
- [Instalasi Environment (Termux/Linux)](#-instalasi-environment-termuxlinux)
- [Mengambil Cookies YouTube](#-mengambil-cookies-youtube)
- [Instalasi Bot](#️-instalasi-bot)
- [Konfigurasi setting.js](#-konfigurasi-settingjs)
- [Menjalankan Bot](#-menjalankan-bot)
- [Struktur Folder](#-struktur-folder)
- [Daftar Command](#-daftar-command)
- [Troubleshooting](#-troubleshooting)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)
- [Support](#-support)

---

## ✨ Fitur

### 🎵 Musik
- Play, pause, resume, stop, skip
- Queue system
- Loop mode
- Volume control
- Menggunakan **Deno** sebagai runtime pemutar audio

### 💰 Economy
- Sistem uang & koin
- Beli/jual item
- Leaderboard

### 🎮 Gacha
- Gacha Waifu & Husbu
- Nikah, cerai, kencan waifu/husbu
- Koleksi & hadiah waifu/husbu

### 🐾 Pokemon System
- Daftar, eksplor, tangkap, evolusi
- Duel Pokemon
- Kandang & tim Pokemon
- Pokeshop, jual/beli Pokemon

### 🗡️ RPG
- Hunt, heal, shop, inventory

### 📈 Leveling
- Text leveling & voice XP
- Role reward otomatis berdasarkan level
- Leaderboard voice & chat

### 🎂 Ulang Tahun
- Set & simpan tanggal ulang tahun
- Notifikasi otomatis ulang tahun member

### 🛡️ Moderasi & Admin
- Ban, warn
- Anti-flood, anti-toxic, anti-remove role
- Confession system (anonim)
- Custom welcome & auto-responder
- Lock/unlock channel

### 🎨 Canvas / Image Generation
- Welcome card
- Profile card
- Family tree
- Ship/couple card
- IQC (image quote card)
- Ban card

### 📥 Downloader
- TikTok (video & audio)
- Instagram
- Pinterest

### 🎭 Fun & Games
- Family system (nikah, cerai keluarga)
- Ship couple
- Tebak bomb
- Tic-tac-toe
- Werewolf
- Wordle
- Confess & couple system
- Streak harian

### 🤖 AI Chat
- Chat AI terintegrasi (Claude/Gemini)

### 🧰 Tools Lainnya
- HD image enhancer
- Remove background
- Roblox stalk
- Discord lookup
- To URL uploader
- Telegram backup otomatis
- Alight Motion Premium

### ⚙️ Owner Tools
- Broadcast pesan
- Kelola owner & staff
- Kelola premium user
- Auto backup
- Deploy slash command
- Lock/unlock fitur

---

## 📦 Requirements

| Kebutuhan | Keterangan |
|---|---|
| **Node.js** | v18 atau lebih baru |
| **Deno** | Dibutuhkan untuk fitur play/musik |
| **FFmpeg** | Untuk proses audio |
| **Git** | Untuk clone repository |
| **Akun Discord Bot** | Buat di [Discord Developer Portal](https://discord.com/developers/applications) |

---

## 🔧 Instalasi Environment (Termux/Linux)

Ikuti urutan ini dari awal kalau baru install di Termux/VPS Linux.

### 1. Update & Upgrade Package

```bash
pkg update && pkg upgrade -y
```

*(kalau di VPS Linux/Debian/Ubuntu, ganti `pkg` dengan `apt`)*

### 2. Install Git

```bash
pkg install git -y
```

### 3. Install Node.js

```bash
pkg install nodejs -y
```

Cek instalasi:
```bash
node -v
npm -v
```

### 4. Install FFmpeg

```bash
pkg install ffmpeg -y
```

### 5. Install PM2 (opsional, biar bot tetap online di background)

```bash
npm install -g pm2
```
---

## ⚙️ Instalasi Bot

### 1. Clone Repository

```bash
git clone https://github.com/ranfemboy/Bot-discord.git
cd Bot-discord
```

### 2. Install Dependencies

```bash
npm install
```

### 3. isi  `setting.js`

```bash
nano setting.js
```

Isi sesuai format berikut, lalu sesuaikan dengan data bot kamu (lihat detail tiap field di bagian [Konfigurasi setting.js](#-konfigurasi-settingjs) di bawah):

```js
export default {
    token: 'YOUR_TOKEN_BOT',

    // Prefix command, contoh: .menu / !menu / #menu
    prefix: '.',

    // ID Discord owner bot (klik kanan profil -> Copy User ID, aktifkan Developer Mode dulu)
    idOwner: 'YOUR_ID',

    // Nama owner yang ditampilkan di menu
    ownerName: 'YOUR_NAME',

    botName: 'bot discord',
    footerText: '© bot discord',

    thumbnailUrl: 'https://x.xcute.workers.dev/f/images/023b67b6ae65.jpg',

    menuSound: 'https://files.catbox.moe/b3rysx.mp3', // muncul sebagai audio player di pesan menu

    menuBanners: [
    'https://x.xcute.workers.dev/f/images/39b6e1a3342d.jpg',
    'https://x.xcute.workers.dev/f/images/62b7eb293ada.jpg',
    'https://x.xcute.workers.dev/f/images/bae45e56b0ea.jpg',
 ],

    supportServerUrl: 'https://discord.gg/cSGfUadrHa',
    supportEmoji: '<a:zclyde_snow:1474998418446483668>',

// ====== TELEGRAM BACKUP ======
    telegramBotToken: 'BOT_TELEGRAM_TOKEN',
    telegramChatId: 'YOUR ID TELEGRAM', // ID user/grup tujuan backup

    saweriaLink: 'https://saweria.co/YOUR_SAWERIA'',
    saweriaChannelId: '',
    // ⚠️ Secret buat verifikasi webhook, jangan sampai bocor
    saweriaSecret: '18609b7f5fc1d4ce1c7f8f93fc2b5298',
    saweriaMessage: '🎉 **{nama}** baru aja donasi **Rp{jumlah}**!\n💬 "{pesan}"',
};```
---

## 🔑 Konfigurasi `setting.js`

| Field | Deskripsi |
|---|---|
| `token` | Token bot dari [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Reset/Copy Token |
| `prefix` | Prefix command teks, contoh: `.`, `!`, `#` |
| `idOwner` | User ID Discord owner bot. Aktifkan Developer Mode di Discord (Settings → Advanced), lalu klik kanan profil kamu → Copy User ID |
| `ownerName` | Nama owner yang ditampilkan di menu bot |
| `botName` | Nama bot yang ditampilkan |
| `footerText` | Teks footer di embed bot |
| `thumbnailUrl` | URL gambar thumbnail default |
| `menuSound` | URL audio yang muncul di pesan `.menu` |
| `menuBanners` | Array URL gambar banner yang tampil bergantian di menu |
| `supportServerUrl` | Link invite Discord server support |
| `supportEmoji` | Emoji custom untuk tombol/pesan support |
| `telegramBotToken` | Token bot Telegram (untuk fitur backup otomatis) |
| `telegramChatId` | ID chat/grup Telegram tujuan backup |
| `saweriaLink` | Link halaman Saweria kamu |
| `saweriaSecret` | Secret key webhook Saweria untuk verifikasi notifikasi donasi — **jangan sampai bocor** |
| `saweriaMessage` | Template pesan saat ada donasi masuk, mendukung placeholder `{nama}`, `{jumlah}`, `{pesan}` |

---

### Install Deno

Fitur **play/musik** pada bot ini berjalan menggunakan **Deno**, jadi wajib diinstall.

```bash
curl -fsSL https://deno.land/install.sh | sh
```

Setelah proses install selesai, tambahkan Deno ke PATH:

```bash
nano ~/.bashrc
```

Tambahkan baris berikut di paling bawah file:

```bash
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

Simpan (`Ctrl+O` → Enter → `Ctrl+X`), lalu reload:

```bash
source ~/.bashrc
```

Cek instalasi:
```bash
deno --version
```

Jika muncul versi Deno (misalnya `deno 1.x.x`), berarti berhasil. ✅


## 🍪 Mengambil Cookies YouTube

Fitur play/download dari YouTube kadang membutuhkan file `cookies.txt` untuk menghindari error **"Sign in to confirm you're not a bot"**. Berikut cara mengambilnya:

### Via Google Chrome (Laptop/PC)

1. Buka Chrome, install ekstensi **"Get cookies.txt LOCALLY"** dari Chrome Web Store
2. Login ke [youtube.com](https://youtube.com) menggunakan akun Google kamu
3. Buka halaman YouTube (pastikan sudah login)
4. Klik ikon ekstensi tersebut di toolbar
5. Klik **Export** / **Download**, simpan sebagai `cookies.txt`
6. Pindahkan file `cookies.txt` tersebut ke folder project bot (sesuaikan path sesuai konfigurasi bot, biasanya di root folder)

### Via Kiwi Browser (Android)

Kiwi Browser mendukung ekstensi Chrome, jadi bisa dipakai untuk ambil cookies langsung dari HP:

1. Install **Kiwi Browser** dari Play Store
2. Buka Kiwi Browser, ketik di address bar: `kiwi://extensions`
3. Aktifkan **Developer mode** (toggle di pojok kanan atas)
4. Buka Chrome Web Store lewat Kiwi, cari **"Get cookies.txt LOCALLY"**, lalu install
5. Login ke [youtube.com](https://youtube.com) di Kiwi Browser
6. Klik ikon ekstensi → Export cookies → simpan `cookies.txt`
7. Pindahkan file `cookies.txt` ke penyimpanan device, lalu transfer ke VPS/server tempat bot berjalan (via Termux storage, SCP, FTP, atau upload manual)

> ⚠️ **Peringatan Keamanan**
> - File `cookies.txt` berisi sesi login akun Google/YouTube kamu. **Jangan pernah** membagikannya ke orang lain.
> - **Jangan upload** file ini ke repository GitHub (publik maupun private). Pastikan sudah masuk `.gitignore`.
> - Jika file ini bocor, segera logout dari semua sesi di [pengaturan keamanan akun Google](https://myaccount.google.com/security).

---

## 🚀 Menjalankan Bot

```bash
node index.js
```

Jika berhasil, akan muncul log bahwa bot online dan siap digunakan di server Discord.

**Untuk menjalankan bot tetap online di background (VPS/Termux) pakai PM2:**

```bash
pm2 start index.js --name bot-discord
pm2 save
```

Cek status & log:
```bash
pm2 status
pm2 logs bot-discord
```

---

## 📁 Struktur Folder

```
.
├── handler/            # Event, message, slash command, & plugin loader
├── lib/                # Store data & fungsi utilitas (canvas, API, database lokal)
│   └── canvas/          # Generator gambar (welcome, profile, family tree, dll)
├── plugins/            # Semua command bot, dikelompokkan per kategori
│   ├── admin/            # Command moderasi & pengaturan server
│   ├── ai/               # Chat AI
│   ├── anime/            # Komik, webtoon, nimegami
│   ├── download/         # Downloader TikTok, IG, Pinterest
│   ├── event/             # Listener event (welcome, leveling, dll)
│   ├── fun/               # Fitur hiburan (family, ship, confess, dll)
│   ├── gacha/             # Gacha waifu/husbu
│   ├── game/              # Mini game (tictactoe, werewolf, wordle, dll)
│   ├── general/           # Command umum (ping, menu, profile, dll)
│   ├── group/             # Fitur grup (afk, antiremove)
│   ├── maker/             # IQC, note IG maker
│   ├── music/             # Command musik
│   ├── owner/             # Command khusus owner bot
│   ├── pokemon/           # Sistem Pokemon
│   ├── random/            # Fitur random (pp couple, dll)
│   ├── rpg/               # Sistem RPG
│   └── tool/, tools/      # Tools tambahan (HD, remove background, dll)
├── assets/              # Font & gambar untuk canvas
├── data/                # Database JSON lokal (diabaikan dari git)
├── setting.js           # File konfigurasi bot berisi token (diabaikan dari git)
├── index.js             # Entry point utama bot
└── package.json
```

---

## 📜 Daftar Command

Ketik `.menu` (atau prefix sesuai konfigurasi `setting.js`) di Discord untuk melihat daftar lengkap command yang tersedia beserta kategorinya.

**Contoh beberapa command:**

| Command | Kategori | Deskripsi |
|---|---|---|
| `.play <judul/link>` | Music | Memutar lagu dari YouTube |
| `.profile` | General | Menampilkan kartu profil |
| `.daftar` | Pokemon | Daftar akun trainer Pokemon |
| `.hunt` | RPG | Berburu monster |
| `.gachawaifu` | Gacha | Gacha karakter waifu |
| `.ship @user1 @user2` | Fun | Menghitung persentase jodoh |
| `.confess <pesan>` | Fun | Kirim pesan anonim |
| `.ban @user` | Admin | Ban member (khusus admin) |
| `.backup` | Owner | Backup database bot |

---

## 🛠️ Troubleshooting

**`deno: command not found`**
- Pastikan langkah install Deno di atas sudah diikuti, terutama bagian export PATH
- Jalankan ulang `source ~/.bashrc` setelah edit file tersebut

**Bot tidak bisa play musik**
- Cek `deno --version` bisa jalan di terminal
- Pastikan `ffmpeg` sudah terinstall (`ffmpeg -version`)

**Error "Sign in to confirm you're not a bot" saat play YouTube**
- Pastikan file `cookies.txt` sudah diambil dan diletakkan sesuai path yang dibutuhkan (lihat bagian [Mengambil Cookies YouTube](#-mengambil-cookies-youtube))
- Cookies YouTube bisa expired, ambil ulang secara berkala jika error muncul lagi

**Bot tidak online / crash saat start**
- Cek apakah `token` di `setting.js` sudah benar dan valid
- Cek log error di terminal untuk detail lebih lanjut

**`Cannot find module 'setting.js'`**
- Berarti file `setting.js` belum dibuat. Ikuti langkah di bagian [Instalasi Bot](#️-instalasi-bot) poin 3

**Command tidak muncul / slash command tidak terdeploy**
- Jalankan ulang deploy slash command lewat command owner terkait

---

## 🤝 Kontribusi

Pull request dan saran fitur baru dipersilakan. Pastikan untuk:
1. Fork repository ini
2. Buat branch baru untuk fitur/perbaikan kamu
3. Ajukan Pull Request dengan deskripsi yang jelas

---

## 📄 Lisensi

Project ini dibuat untuk keperluan pribadi/komunitas. Silakan digunakan dan dimodifikasi dengan bijak. Dilarang menjual ulang tanpa izin.

---

## 💬 Support

- Discord Server: [Join di sini](https://discord.gg/cSGfUadrHa)
- Donasi: [Saweria](https://saweria.co/ranzzchan)

---

<p align="center">Made with ✨ by ranfemboy</p>
