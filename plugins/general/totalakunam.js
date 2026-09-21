import fs from 'fs'

// Import canvas dengan cara berbeda untuk avoid duplikasi
let Canvas
try {
    Canvas = await import('@napi-rs/canvas').then(m => m.createCanvas)
} catch (e) {
    // Fallback jika ada error
    console.warn('Canvas import failed:', e.message)
    Canvas = null
}

const pluginConfig = {
    name: 'totalakun',
    alias: ['takunam', 'jumlahakun'],
    category: 'general',
    description: 'Menampilkan total akun AM dengan visual canvas',
    usage: '.totalakun',
    example: '.totalakun',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { client }) {
    try {
        // Baca data dari amprem.json
        const ampremPath = './data/amprem.json'
        let ampremData = {}
        
        if (fs.existsSync(ampremPath)) {
            const rawData = fs.readFileSync(ampremPath, 'utf-8')
            ampremData = JSON.parse(rawData)
        }

        // Hitung total akun
        const totalAkun = Object.keys(ampremData).length

        // Jika canvas tidak tersedia, gunakan embed saja
        if (!Canvas) {
            const embed = {
                color: 0x667eea,
                title: '📊 Total Akun AM',
                description: `**Total Akun:** \`${totalAkun}\`\n**Status:** \`✓ Aktif\``,
                fields: [
                    {
                        name: '📈 Informasi',
                        value: `Sistem AM memiliki **${totalAkun}** akun terdaftar.`,
                        inline: false
                    }
                ],
                footer: {
                    text: `Update: ${new Date().toLocaleString('id-ID')}`
                }
            }
            await m.reply({ embeds: [embed] })
            return
        }

        // Generate canvas jika tersedia
        const { createCanvas: makeCanvas } = await import('@napi-rs/canvas')
        const canvas = makeCanvas(900, 500)
        const ctx = canvas.getContext('2d')

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 900, 500)
        gradient.addColorStop(0, '#667eea')
        gradient.addColorStop(1, '#764ba2')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 900, 500)

        // Overlay pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(i * 45, 0, 30, 500)
        }

        // Rounded rectangle
        function roundRect(x, y, w, h, r) {
            ctx.beginPath()
            ctx.moveTo(x + r, y)
            ctx.lineTo(x + w - r, y)
            ctx.quadraticCurveTo(x + w, y, x + w, y + r)
            ctx.lineTo(x + w, y + h - r)
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
            ctx.lineTo(x + r, y + h)
            ctx.quadraticCurveTo(x, y + h, x, y + h - r)
            ctx.lineTo(x, y + r)
            ctx.quadraticCurveTo(x, y, x + r, y)
            ctx.closePath()
        }

        // Card background
        roundRect(50, 80, 800, 340, 20)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Title
        ctx.font = 'bold 48px Arial'
        ctx.fillStyle = '#667eea'
        ctx.textAlign = 'center'
        ctx.fillText('📊 TOTAL AKUN AM', 450, 150)

        // Accent line
        ctx.fillStyle = '#764ba2'
        ctx.fillRect(250, 165, 400, 3)

        // Big number
        ctx.font = 'bold 120px Arial'
        const gradient2 = ctx.createLinearGradient(350, 200, 550, 280)
        gradient2.addColorStop(0, '#667eea')
        gradient2.addColorStop(1, '#764ba2')
        ctx.fillStyle = gradient2
        ctx.textAlign = 'center'
        ctx.fillText(totalAkun.toString(), 450, 280)

        // Description
        ctx.font = '18px Arial'
        ctx.fillStyle = '#555'
        ctx.textAlign = 'center'
        ctx.fillText(`${totalAkun} akun terdaftar dalam sistem AM`, 450, 320)

        // Info boxes
        const boxWidth = 150
        const boxHeight = 60
        const startX = 150

        // Box 1
        roundRect(startX, 350, boxWidth, boxHeight, 10)
        ctx.fillStyle = 'rgba(102, 126, 234, 0.1)'
        ctx.fill()
        ctx.strokeStyle = '#667eea'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.font = 'bold 24px Arial'
        ctx.fillStyle = '#667eea'
        ctx.textAlign = 'center'
        ctx.fillText(totalAkun.toString(), startX + boxWidth / 2, 375)
        ctx.font = '14px Arial'
        ctx.fillStyle = '#666'
        ctx.fillText('Akun', startX + boxWidth / 2, 395)

        // Box 2
        roundRect(startX + 200, 350, boxWidth, boxHeight, 10)
        ctx.fillStyle = 'rgba(118, 75, 162, 0.1)'
        ctx.fill()
        ctx.strokeStyle = '#764ba2'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.font = 'bold 24px Arial'
        ctx.fillStyle = '#764ba2'
        ctx.textAlign = 'center'
        ctx.fillText('✓', startX + 200 + boxWidth / 2, 375)
        ctx.font = '14px Arial'
        ctx.fillStyle = '#666'
        ctx.fillText('Aktif', startX + 200 + boxWidth / 2, 395)

        // Box 3
        roundRect(startX + 400, 350, boxWidth, boxHeight, 10)
        ctx.fillStyle = 'rgba(102, 126, 234, 0.1)'
        ctx.fill()
        ctx.strokeStyle = '#667eea'
        ctx.lineWidth = 2
        ctx.stroke()

        const now = new Date().toLocaleDateString('id-ID', { month: '2-digit', day: '2-digit' })
        ctx.font = 'bold 14px Arial'
        ctx.fillStyle = '#667eea'
        ctx.textAlign = 'center'
        ctx.fillText(now, startX + 400 + boxWidth / 2, 375)
        ctx.font = '12px Arial'
        ctx.fillStyle = '#666'
        ctx.fillText('Update', startX + 400 + boxWidth / 2, 395)

        // Convert to buffer
        const buffer = canvas.toBuffer('image/png')

        // Send with embed
        const embed = {
            color: 0x667eea,
            title: '📊 Statistik Total Akun AM',
            description: `Total akun AM yang terdaftar: **\`${totalAkun}\`**\n\nSetiap akun memberikan akses ke fitur premium di bot ini.`,
            footer: {
                text: `Update: ${new Date().toLocaleString('id-ID')}`
            }
        }

        await m.reply({
            embeds: [embed],
            files: [{
                attachment: buffer,
                name: 'totalakun.png'
            }]
        })

    } catch (error) {
        console.error('Error di totalakun:', error)
        await m.reply(`❌ *GAGAL*\n\n\`\`\`${error.message}\`\`\``)
    }
}

export { pluginConfig as config, handler }