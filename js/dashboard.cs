const STORAGE_KEY = 'rs_history';

const RECOMMENDATIONS = {
    'None': {
        label: 'Pola Tidur Sehat',
        tagClass: 'tag-sage',
        dotClass: 'dot-sage',
        borderColor: 'var(--sage)',
        intro: 'Tidak terdeteksi gangguan tidur. Pertahankan kebiasaan ini:',
        tips: [
            'Jaga konsistensi jam tidur dan bangun, termasuk di akhir pekan.',
            'Pertahankan durasi tidur 7–9 jam per malam.',
            'Tetap aktif, aktivitas fisik rutin menjaga kualitas tidur jangka panjang.',
            'Paparan sinar matahari pagi membantu mengatur ritme sirkadian.',
            'Pantau stres harianmu, lonjakan stres adalah sinyal paling awal gangguan tidur.',
        ]
    },
    'Insomnia': {
        label: 'Indikasi Insomnia',
        tagClass: 'tag-sand',
        dotClass: 'dot-sand',
        borderColor: 'var(--sand)',
        intro: 'Terdeteksi risiko insomnia. Langkah yang bisa mulai kamu coba:',
        tips: [
            'Tetapkan rutinitas tidur yang konsisten, tidur dan bangun di jam yang sama setiap hari.',
            'Hindari layar HP/laptop minimal 45 menit sebelum tidur. Cahaya biru menekan produksi melatonin.',
            'Coba teknik <strong>4-7-8</strong>: tarik napas 4 detik → tahan 7 detik → hembuskan 8 detik.',
            'Batasi kafein setelah pukul 14.00 dan hindari alkohol, keduanya mengganggu siklus REM.',
            'Jika tidak bisa tidur setelah 20 menit, keluar dari kasur dan lakukan aktivitas tenang.',
            'Kelola stres harianmu, level stres tinggi adalah pemicu utama insomnia.',
        ]
    },
    'Sleep Apnea': {
        label: 'Indikasi Sleep Apnea',
        tagClass: 'tag-red',
        dotClass: 'dot-red',
        borderColor: '#d98080',
        intro: 'Terdeteksi risiko sleep apnea. Ini perlu perhatian lebih serius:',
        tips: [
            '<strong>Konsultasikan ke dokter</strong>. Sleep apnea memerlukan pemeriksaan resmi untuk diagnosis pasti.',
            'Tidur dalam posisi miring (bukan telentang) dapat membantu membuka saluran pernapasan.',
            'Jaga berat badan ideal. Kelebihan lemak di area leher mempersempit saluran napas.',
            'Hindari alkohol dan obat penenang sebelum tidur, keduanya melemaskan otot tenggorokan.',
            'Monitor tekanan darah secara berkala. Sleep apnea dan hipertensi saling memperburuk.',
            'Pertimbangkan konsultasi mengenai alat CPAP jika gejala berlanjut.',
        ]
    }
};

function predict(data) {
    const dur      = parseFloat(data.sleep_duration);
    const quality  = parseInt(data.quality);
    const stress   = parseInt(data.stress);
    const systolic = parseInt(data.systolic);
    const bmi      = data.bmi;
    const activity = parseInt(data.activity);

    const apneaScore =
        (systolic > 135 ? 2 : 0) +
        (bmi === 'Obese' ? 2 : bmi === 'Overweight' ? 1 : 0) +
        (dur < 6 && quality <= 4 ? 1 : 0) +
        (stress >= 7 ? 1 : 0);

    if (apneaScore >= 3) return 'Sleep Apnea';

    const insomniaScore =
        (dur < 6 ? 2 : dur < 7 ? 1 : 0) +
        (quality <= 4 ? 2 : quality <= 6 ? 1 : 0) +
        (stress >= 7 ? 2 : stress >= 5 ? 1 : 0) +
        (activity < 30 ? 1 : 0);

    if (insomniaScore >= 4) return 'Insomnia';
    if (dur >= 7 && quality >= 7 && stress <= 5) return 'None';
    if (insomniaScore >= 2) return 'Insomnia';
    return 'None';
}

function loadHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
}

function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function formatDate(isoStr) {
    return new Date(isoStr).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
}

function renderHistory(history) {
    const container = document.getElementById('history-list');
    const empty     = document.getElementById('history-empty');

    if (!history.length) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    container.innerHTML = history
        .slice().reverse()
        .map(item => {
            const rec = RECOMMENDATIONS[item.result] || RECOMMENDATIONS['None'];
            return `
            <div class="history-item">
                <div class="history-left">
                    <span class="tag ${rec.tagClass}">
                        <span class="dot ${rec.dotClass}"></span>
                        ${rec.label}
                    </span>
                    <div class="history-meta">
                        Tidur: <strong>${item.sleep_duration} jam</strong> &nbsp;·&nbsp;
                        Kualitas: <strong>${item.quality}/10</strong> &nbsp;·&nbsp;
                        Stres: <strong>${item.stress}/10</strong>
                    </div>
                </div>
                <div class="history-date">${formatDate(item.date)}</div>
            </div>`;
        }).join('');

    document.getElementById('stat-total').textContent = history.length + ' Kali';
    const last = history[history.length - 1];
    if (last) {
        const r = RECOMMENDATIONS[last.result] || RECOMMENDATIONS['None'];
        document.getElementById('stat-last').textContent = r.label;
    }
}

function renderResult(result, data) {
    const rec  = RECOMMENDATIONS[result] || RECOMMENDATIONS['None'];
    const card = document.getElementById('result-card');

    card.style.borderLeftColor = rec.borderColor;
    document.getElementById('res-label').textContent   = rec.label;
    document.getElementById('res-label').className     = 'tag ' + rec.tagClass;
    document.getElementById('res-intro').textContent   = rec.intro;
    document.getElementById('res-dur').textContent     = data.sleep_duration;
    document.getElementById('res-quality').textContent = data.quality;
    document.getElementById('res-stress').textContent  = data.stress;

    document.getElementById('res-tips').innerHTML = rec.tips
        .map(t => '<li>' + t + '</li>').join('');

    card.style.display = 'block';
    setTimeout(function() {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
}

function initUser() {
    var user = { name: 'Pengguna', email: '' };
    try {
        var stored = sessionStorage.getItem('rs_user');
        if (stored) user = JSON.parse(stored);
    } catch(e) {}

    var name  = user.name || 'Pengguna';
    var parts = name.trim().split(' ');
    var initials = parts.length >= 2
        ? parts[0][0] + parts[parts.length - 1][0]
        : name.slice(0, 2);

    document.getElementById('profile-initials').textContent = initials.toUpperCase();
    document.getElementById('profile-name').textContent     = name;
    document.getElementById('profile-email').textContent    = user.email || '';
    document.getElementById('profile-joined').textContent   =
        new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', function() {
    initUser();
    renderHistory(loadHistory());

    var form = document.getElementById('predict-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // field IDs yang wajib diisi (slider tidak perlu karena selalu ada value)
        var requiredFields = [
            'inp-age', 'inp-gender', 'inp-sleep',
            'inp-activity', 'inp-bmi',
            'inp-systolic', 'inp-diastolic', 'inp-hr', 'inp-steps'
        ];

        // reset border
        requiredFields.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.style.borderColor = '';
        });

        // cek kosong
        var emptyFields = requiredFields.filter(function(id) {
            var el = document.getElementById(id);
            return !el || el.value === '' || el.value === null;
        });

        if (emptyFields.length > 0) {
            emptyFields.forEach(function(id) {
                var el = document.getElementById(id);
                if (el) el.style.borderColor = '#d98080';
            });
            var firstEl = document.getElementById(emptyFields[0]);
            if (firstEl) {
                firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstEl.focus();
            }
            return; 
        }

        var data = {
            age:            document.getElementById('inp-age').value,
            gender:         document.getElementById('inp-gender').value,
            sleep_duration: document.getElementById('inp-sleep').value,
            quality:        document.getElementById('inp-quality').value,
            activity:       document.getElementById('inp-activity').value,
            stress:         document.getElementById('inp-stress').value,
            bmi:            document.getElementById('inp-bmi').value,
            systolic:       document.getElementById('inp-systolic').value,
            diastolic:      document.getElementById('inp-diastolic').value,
            heart_rate:     document.getElementById('inp-hr').value,
            daily_steps:    document.getElementById('inp-steps').value,
            date:           new Date().toISOString(),
        };

        var result  = predict(data);
        data.result = result;

        var history = loadHistory();
        history.push(data);
        saveHistory(history);
        renderHistory(history);
        renderResult(result, data);
    });
});