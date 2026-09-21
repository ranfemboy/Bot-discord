import { createCanvas } from '@napi-rs/canvas'
import fs from 'fs'

const pluginConfig = {
    name: 'checkstock',
    alias: ['cekstock', 'stockam', 'akunstock'],
    category: 'general',
    description: 'Cek stock dan sisa akun AM yang tersedia',
    usage: '.checkstock',
    example: '.checkstock',
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
        // Baca amprem.json
        const ampremPath = './data/amprem.json'
        let ampremData = {}
        
        if (fs.existsSync(ampremPath)) {
            const rawData = fs.readFileSync(ampremPath, 'utf-8')
            ampremData = JSON.parse(rawData)
        }

        // Hitung total & yang terpakai
        const totalStock = Object.keys(ampremData).length
        const terpakaiCount = Object.values(ampremData).filter(a => a.used === true || a.dipakai === true).length
        const sisaStock = totalStock - terpakaiCount

        // Generate canvas
        const canvas = createCanvas(1000, 600)
        const ctx = canvas.getContext('2d')

        // Background gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 1000, 600)
        bgGradient.addColorStop(0, '#1a1a2e')
        bgGradient.addColorStop(0.5, '#16213e')
        bgGradient.addColorStop(1, '#0f3460')
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, 1000, 600)

        // Particle effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 1000
            const y = Math.random() * 600
            ctx.fillRect(x, y, 2, 2)
        }

        // Helper function - rounded rect
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

        // Title header
        ctx.font = 'bold 56px Arial'
        ctx.fillStyle = '#00d4ff'
        ctx.textAlign = 'center'
        ctx.fillText('📦 STOCK AKUN AM', 500, 70)

        // Accent line
        ctx.fillStyle = '#00d4ff'
        ctx.fillRect(250, 90, 500, 3)

        // Card 1 - Total Stock
        roundRect(80, 130, 260, 180, 15)
        ctx.fillStyle = 'rgba(0, 212, 255, 0.1)'
        ctx.fill()
        ctx.strokeStyle = '#00d4ff'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.font = 'bold 48px Arial'
        ctx.fillStyle = '#00d4ff'
        ctx.textAlign = 'center'
        ctx.fillText(totalStock.toString(), 210, 220)
        ctx.font = '20px Arial'
        ctx.fillStyle = '#99ccff'
        ctx.fillText('Total Stock', 210, 260)

        // Card 2 - Terpakai
        roundRect(370, 130, 260, 180, 15)
        ctx.fillStyle = 'rgba(255, 107, 107, 0.1)'
        ctx.fill()
        ctx.strokeStyle = '#ff6b6b'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.font = 'bold 48px Arial'
        ctx.fillStyle = '#ff6b6b'
        ctx.textAlign = 'center'
        ctx.fillText(terpakaiCount.toString(), 500, 220)
        ctx.font = '20px Arial'
        ctx.fillStyle = '#ff9999'
        ctx.fillText('Terpakai', 500, 260)

        // Card 3 - Sisa Stock
        roundRect(660, 130, 260, 180, 15)
        ctx.fillStyle = 'rgba(76, 175, 80, 0.1)'
        ctx.fill()
        ctx.strokeStyle = '#4caf50'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.font = 'bold 48px Arial'
        ctx.fillStyle = '#4caf50'
        ctx.textAlign = 'center'
        ctx.fillText(sisaStock.toString(), 790, 220)
        ctx.font = '20px Arial'
        ctx.fillStyle = '#81c784'
        ctx.fillText('Sisa Stock', 790, 260)

        // Info section
        roundRect(80, 340, 840, 220, 15)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Info title
        ctx.font = 'bold 28px Arial'
        ctx.fillStyle = '#00d4ff'
        ctx.textAlign = 'left'
        ctx.fillText('📊 Informasi Detail', 110, 385)

        // Info content
        ctx.font = '18px Arial'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'left'
        const lineHeight = 35
        const infoX = 110
        let infoY = 425

        ctx.fillText(`✓ Total Akun: ${totalStock} akun`, infoX, infoY)
        infoY += lineHeight

        ctx.fillText(`✗ Akun Terpakai: ${terpakaiCount} akun`, infoX, infoY)
        infoY += lineHeight

        ctx.fillStyle = '#4caf50'
        ctx.fillText(`○ Sisa Tersedia: ${sisaStock} akun`, infoX, infoY)
        infoY += lineHeight

        // Percentage bar
        ctx.fillStyle = '#ffffff'
        ctx.font = '16px Arial'
        ctx.fillText('Penggunaan:', infoX, infoY + 15)

        const barWidth = 400
        const barHeight = 20
        const barX = infoX + 200
        const barY = infoY

        // Background bar
        roundRect(barX, barY, barWidth, barHeight, 10)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fill()

        // Usage percentage
        const usagePercent = totalStock > 0 ? (terpakaiCount / totalStock) * 100 : 0
        const fillWidth = (barWidth * usagePercent) / 100

        // Fill bar
        roundRect(barX, barY, fillWidth, barHeight, 10)
        const barGradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY)
        barGradient.addColorStop(0, '#ff6b6b')
        barGradient.addColorStop(1, '#ff9999')
        ctx.fillStyle = barGradient
        ctx.fill()

        // Percentage text
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${usagePercent.toFixed(1)}%`, barX + barWidth / 2, barY + 15)

        // Footer
        ctx.font = '14px Arial'
        ctx.fillStyle = '#99ccff'
        ctx.textAlign = 'center'
        ctx.fillText(`Update: ${new Date().toLocaleString('id-ID')}`, 500, 580)

        // Convert to buffer
        const buffer = canvas.toBuffer('image/png')

        // Send with embed
        const embed = {
            color: 0x00d4ff,
            title: '📦 Stock Akun AM',
            description: `**Total Stock:** \`${totalStock}\`\n**Terpakai:** \`${terpakaiCount}\`\n**Sisa:** \`${sisaStock}\`\n\n**Persentase Penggunaan:** \`${usagePercent.toFixed(2)}%\``,
            fields: [
                {
                    name: '📈 Status Stock',
                    value: sisaStock > 0 
                        ? `✅ Masih ada **${sisaStock}** akun tersedia` 
                        : '⚠️ Stock habis! Perlu restok akun baru',
                    inline: false
                }
            ],
            footer: {
                text: `Dipanggil oleh ${m.pushName || 'User'}`
            }
        }

        await m.reply({
            embeds: [embed],
            files: [{
                attachment: buffer,
                name: 'stock-akun.png'
            }]
        })

    } catch (error) {
        console.error('Error di checkstock:', error)
        await m.reply(`❌ *GAGAL*\n\n\`\`\`${error.message}\`\`\``)
    }
}

export { pluginConfig as config, handler }