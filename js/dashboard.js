const STORAGE_KEY = "rs_history";

const RECOMMENDATIONS = {
  None: {
    label: "Pola Tidur Sehat",
    tagClass: "tag-sage",
    dotClass: "dot-sage",
    borderColor: "var(--sage)",
    intro: "Tidak terdeteksi gangguan tidur. Pertahankan kebiasaan ini:",
    tips: [
      "Jaga konsistensi jam tidur dan bangun, termasuk di akhir pekan.",
      "Pertahankan durasi tidur 7–9 jam per malam.",
      "Tetap aktif, aktivitas fisik rutin menjaga kualitas tidur jangka panjang.",
      "Paparan sinar matahari pagi membantu mengatur ritme sirkadian.",
      "Pantau stres harianmu, lonjakan stres adalah sinyal paling awal gangguan tidur.",
    ],
    verdictIcon: "✅",
    verdictTitle: "Tidak terdeteksi gangguan tidur",
    verdictDesc:
      "Parameter tubuhmu berada dalam rentang normal. Model AI tidak menemukan pola yang berkaitan dengan gangguan tidur.",
    verdictClass: "verdict-normal",
    accentColor: "var(--sage)",
    insightPrefix: "Faktor yang paling melindungimu dari gangguan tidur adalah",
  },
  Insomnia: {
    label: "Indikasi Insomnia",
    tagClass: "tag-sand",
    dotClass: "dot-sand",
    borderColor: "var(--sand)",
    intro: "Terdeteksi risiko insomnia. Langkah yang bisa mulai kamu coba:",
    tips: [
      "Tetapkan rutinitas tidur yang konsisten, tidur dan bangun di jam yang sama setiap hari.",
      "Hindari layar HP/laptop minimal 45 menit sebelum tidur. Cahaya biru menekan produksi melatonin.",
      "Coba teknik <strong>4-7-8</strong>: tarik napas 4 detik → tahan 7 detik → hembuskan 8 detik.",
      "Batasi kafein setelah pukul 14.00 dan hindari alkohol, keduanya mengganggu siklus REM.",
      "Jika tidak bisa tidur setelah 20 menit, keluar dari kasur dan lakukan aktivitas tenang.",
      "Kelola stres harianmu, level stres tinggi adalah pemicu utama insomnia.",
    ],
    verdictIcon: "⚠️",
    verdictTitle: "Terdeteksi indikasi Insomnia",
    verdictDesc:
      "Model AI mendeteksi pola yang konsisten dengan insomnia berdasarkan kombinasi faktor di bawah ini.",
    verdictClass: "verdict-insomnia",
    accentColor: "var(--sand)",
    insightPrefix:
      "Faktor yang paling berkontribusi terhadap prediksi insomnia adalah",
  },
  "Sleep Apnea": {
    label: "Indikasi Sleep Apnea",
    tagClass: "tag-red",
    dotClass: "dot-red",
    borderColor: "#d98080",
    intro: "Terdeteksi risiko sleep apnea. Ini perlu perhatian lebih serius:",
    tips: [
      "<strong>Konsultasikan ke dokter</strong>. Sleep apnea memerlukan pemeriksaan resmi untuk diagnosis pasti.",
      "Tidur dalam posisi miring (bukan telentang) dapat membantu membuka saluran pernapasan.",
      "Jaga berat badan ideal. Kelebihan lemak di area leher mempersempit saluran napas.",
      "Hindari alkohol dan obat penenang sebelum tidur, keduanya melemaskan otot tenggorokan.",
      "Monitor tekanan darah secara berkala. Sleep apnea dan hipertensi saling memperburuk.",
      "Pertimbangkan konsultasi mengenai alat CPAP jika gejala berlanjut.",
    ],
    verdictIcon: "🔴",
    verdictTitle: "Terdeteksi indikasi Sleep Apnea",
    verdictDesc:
      "Model AI mendeteksi kombinasi parameter yang berkaitan erat dengan sleep apnea. Segera konsultasikan ke tenaga medis.",
    verdictClass: "verdict-apnea",
    accentColor: "#d98080",
    insightPrefix:
      "Faktor risiko terbesar yang memicu prediksi sleep apnea adalah",
  },
};

/* ── STORAGE ── */
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/* ── DATE FORMAT ── */
function formatDate(isoStr) {
  return new Date(isoStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ── RENDER HISTORY ── */
function renderHistory(history) {
  const container = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");

  if (!container) return;

  if (!history.length) {
    container.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  container.innerHTML = history
    .slice()
    .reverse()
    .map((item) => {
      const rec = RECOMMENDATIONS[item.result] || RECOMMENDATIONS["None"];
      return `
            <div class="history-item">
                <div class="history-left">
                    <span class="tag ${rec.tagClass}">
                        <span class="dot ${rec.dotClass}"></span>
                        ${rec.label}
                    </span>
                    <div class="history-meta">
                        Tidur: <strong>${item.sleep_duration} jam</strong> &nbsp;·&nbsp;
                        Kualitas: <strong>${item.quality_of_sleep || 5}/10</strong> &nbsp;·&nbsp;
                        Stres: <strong>${item.stress_level || 5}/10</strong>
                    </div>
                </div>
                <div class="history-date">${formatDate(item.date)}</div>
            </div>`;
    })
    .join("");

  const statTotal = document.getElementById("stat-total");
  const statLast = document.getElementById("stat-last");

  if (statTotal) statTotal.textContent = history.length + " Kali";

  const last = history[history.length - 1];
  if (last && statLast) {
    const r = RECOMMENDATIONS[last.result] || RECOMMENDATIONS["None"];
    statLast.textContent = r.label;
  }
}

/* ── XAI FACTOR ENGINE ── */
function computeFactors(result, data) {
  const isNormal = result === "None";
  const isApnea = result === "Sleep Apnea";

  const stress = parseFloat(data.stress_level) || 5;
  const duration = parseFloat(data.sleep_duration) || 7;
  const quality = parseFloat(data.quality_of_sleep) || 5;
  const systolic = parseFloat(data.systolic) || 120;
  const physical = parseFloat(data.physical_activity) || 30;
  const hr = parseFloat(data.heart_rate) || 72;
  const bmi = data.bmi || "Normal";

  // BMI risk score
  const bmiRisk = bmi === "Obese" ? 80 : bmi === "Overweight" ? 45 : 10;

  let rawFactors;

  if (isNormal) {
    rawFactors = [
      {
        name: "Tingkat Stres",
        value: `${stress}/10`,
        weight: (10 - stress) * 9,
        suffix:
          stress <= 4
            ? "Sangat Rileks"
            : stress <= 6
              ? "Terkontrol"
              : "Perlu Perhatian",
        description:
          stress <= 5
            ? `Stres ${stress}/10 tergolong rendah, memberikan perlindungan kuat terhadap gangguan tidur.`
            : `Stres ${stress}/10 masih dalam batas toleransi, namun perlu dipantau.`,
      },
      {
        name: "Kualitas Tidur",
        value: `${quality}/10`,
        weight: quality * 8,
        suffix:
          quality >= 7
            ? "Sangat Baik"
            : quality >= 5
              ? "Cukup"
              : "Perlu Ditingkatkan",
        description: `Kualitas tidur ${quality}/10 menunjukkan istirahat yang ${quality >= 7 ? "berkualitas" : "cukup memadai"}.`,
      },
      {
        name: "Durasi Tidur",
        value: `${duration} jam`,
        weight:
          duration >= 7 && duration <= 9
            ? 78
            : Math.max(100 - Math.abs(8 - duration) * 15, 10),
        suffix:
          duration >= 7 && duration <= 9
            ? "Ideal"
            : duration < 7
              ? "Kurang"
              : "Berlebih",
        description: `Durasi ${duration} jam ${duration >= 7 && duration <= 9 ? "berada dalam rentang ideal 7–9 jam." : "di luar rentang optimal."}`,
      },
      {
        name: "Aktivitas Fisik",
        value: `${physical} menit/hari`,
        weight: Math.min(physical * 0.85, 72),
        suffix:
          physical >= 45
            ? "Aktif"
            : physical >= 20
              ? "Moderat"
              : "Kurang Aktif",
        description: `Aktivitas fisik ${physical} menit/hari membantu mengatur ritme sirkadian dan meningkatkan kualitas tidur.`,
      },
      {
        name: "Tekanan Darah Sistolik",
        value: `${systolic} mmHg`,
        weight: Math.max(80 - Math.abs(systolic - 120) * 1.2, 10),
        suffix:
          systolic < 130 ? "Normal" : systolic < 140 ? "Elevated" : "Tinggi",
        description: `Tekanan darah sistolik ${systolic} mmHg ${systolic < 130 ? "berada dalam rentang normal." : "sedikit di atas ideal."}`,
      },
    ];
  } else if (isApnea) {
    rawFactors = [
      {
        name: "Tekanan Darah Sistolik",
        value: `${systolic} mmHg`,
        weight: Math.min(Math.abs(systolic - 115) * 1.8, 90),
        suffix:
          systolic >= 130
            ? "Hipertensi"
            : systolic >= 125
              ? "Elevated"
              : "Borderline",
        description: `Sistolik ${systolic} mmHg merupakan indikator kardiovaskular yang sangat berkorelasi dengan sleep apnea.`,
      },
      {
        name: "Kategori BMI",
        value: bmi,
        weight: bmiRisk,
        suffix:
          bmi === "Obese"
            ? "Risiko Tinggi"
            : bmi === "Overweight"
              ? "Risiko Sedang"
              : "Risiko Rendah",
        description: `BMI kategori ${bmi} berpengaruh langsung pada lebar saluran napas saat tidur.`,
      },
      {
        name: "Detak Jantung",
        value: `${hr} BPM`,
        weight: Math.min(Math.abs(hr - 68) * 1.5, 75),
        suffix: hr > 80 ? "Elevated" : hr < 60 ? "Rendah" : "Normal",
        description: `Detak jantung ${hr} BPM saat istirahat berkontribusi sebagai penanda kondisi kardiovaskular.`,
      },
      {
        name: "Kualitas Tidur",
        value: `${quality}/10`,
        weight: Math.max((10 - quality) * 8, 10),
        suffix:
          quality <= 4 ? "Sangat Buruk" : quality <= 6 ? "Buruk" : "Moderat",
        description: `Kualitas tidur ${quality}/10 menunjukkan gangguan istirahat yang khas pada penderita sleep apnea.`,
      },
      {
        name: "Tingkat Stres",
        value: `${stress}/10`,
        weight: stress * 7.5,
        suffix:
          stress >= 7 ? "Beban Tinggi" : stress >= 5 ? "Moderat" : "Terkontrol",
        description: `Stres ${stress}/10 memperburuk respons tubuh terhadap gangguan pernapasan saat tidur.`,
      },
    ];
  } else {
    // Insomnia
    rawFactors = [
      {
        name: "Tingkat Stres",
        value: `${stress}/10`,
        weight: stress * 9,
        suffix:
          stress >= 7
            ? "Pemicu Utama"
            : stress >= 5
              ? "Berkontribusi"
              : "Moderat",
        description: `Stres ${stress}/10 adalah pemicu paling dominan insomnia — pikiran aktif menghambat transisi ke tidur.`,
      },
      {
        name: "Kualitas Tidur",
        value: `${quality}/10`,
        weight: Math.max((10 - quality) * 9, 10),
        suffix:
          quality <= 4
            ? "Sangat Buruk"
            : quality <= 6
              ? "Terganggu"
              : "Moderat",
        description: `Kualitas tidur ${quality}/10 menandakan fragmentasi tidur yang khas pada insomnia.`,
      },
      {
        name: "Durasi Tidur",
        value: `${duration} jam`,
        weight: Math.max((7.5 - duration) * 18, 8),
        suffix:
          duration < 6 ? "Sangat Kurang" : duration < 7 ? "Kurang" : "Cukup",
        description: `Durasi ${duration} jam berada di bawah ambang restoratif, memperparah siklus insomnia.`,
      },
      {
        name: "Aktivitas Fisik",
        value: `${physical} menit/hari`,
        weight: Math.max(65 - physical, 8),
        suffix:
          physical < 20
            ? "Sangat Kurang"
            : physical < 40
              ? "Kurang"
              : "Moderat",
        description: `Aktivitas fisik ${physical} menit/hari yang rendah mengurangi tekanan tidur alami tubuh.`,
      },
      {
        name: "Detak Jantung",
        value: `${hr} BPM`,
        weight: Math.min(Math.abs(hr - 68) * 1.3, 70),
        suffix: hr > 78 ? "Elevated" : "Normal",
        description: `Detak jantung ${hr} BPM saat istirahat mencerminkan aktivasi sistem saraf simpatis yang mengganggu tidur.`,
      },
    ];
  }

  // Sort by weight descending
  rawFactors.sort((a, b) => b.weight - a.weight);
  return rawFactors;
}

/* ── RENDER RESULT ── */
function renderResult(result, data) {
  const rec = RECOMMENDATIONS[result] || RECOMMENDATIONS["None"];
  const card = document.getElementById("result-card");
  if (!card) return;

  // Header & meta
  card.style.borderLeftColor = rec.borderColor;
  const labelEl = document.getElementById("res-label");
  labelEl.textContent = rec.label;
  labelEl.className = "tag " + rec.tagClass;
  document.getElementById("res-intro").textContent = rec.intro;
  document.getElementById("res-dur").textContent = data.sleep_duration;
  document.getElementById("res-quality").textContent = data.quality_of_sleep;
  document.getElementById("res-stress").textContent = data.stress_level;
  document.getElementById("res-tips").innerHTML = rec.tips
    .map((t) => "<li>" + t + "</li>")
    .join("");

  // XAI summary text
  document.getElementById("xai-summary").innerHTML =
    `Model XGBoost menganalisis <strong>11 parameter</strong> dari data yang kamu masukkan. Berikut adalah penjelasan transparan tentang faktor-faktor yang paling berpengaruh terhadap hasil prediksi <strong>${rec.label}</strong>:`;

  // Verdict banner
  const verdictEl = document.getElementById("xai-verdict");
  verdictEl.className = "xai-verdict " + rec.verdictClass;
  document.getElementById("verdict-icon").textContent = rec.verdictIcon;
  document.getElementById("verdict-title").textContent = rec.verdictTitle;
  document.getElementById("verdict-desc").textContent = rec.verdictDesc;

  // Compute factors
  const factors = computeFactors(result, data);
  const top3 = factors.slice(0, 3);
  const othersSum = Math.round(
    factors
      .slice(3)
      .reduce((s, f) => s + Math.min(Math.max(f.weight, 5), 95), 0) /
      Math.max(factors.slice(3).length, 1),
  );

  // Normalize top 3 to cap at 95
  const maxW = top3[0].weight || 1;
  const top3Normalized = top3.map((f) => ({
    ...f,
    display: Math.round(Math.min(Math.max((f.weight / maxW) * 90, 8), 95)),
  }));

  const container = document.getElementById("xai-factors-list");
  container.innerHTML = "";

  top3Normalized.forEach((factor, idx) => {
    const rank = ["🥇", "🥈", "🥉"][idx];
    const colorStyle = `color: ${rec.accentColor};`;
    const barStyle = `background: ${rec.accentColor};`;

    container.insertAdjacentHTML(
      "beforeend",
      `
            <div class="xai-bar-row">
                <div class="xai-bar-meta">
                    <span class="xai-factor-name">${rank} ${factor.name} <span style="font-weight:400; color:var(--muted);">(${factor.value})</span></span>
                    <div class="xai-factor-right">
                        <span class="xai-factor-pct" style="${colorStyle}">${factor.display}%</span>
                        <span class="xai-factor-suffix">${factor.suffix}</span>
                    </div>
                </div>
                <div class="xai-bar-track">
                    <div class="xai-bar-fill" data-width="${factor.display}" style="${barStyle}"></div>
                </div>
                <p style="font-size:0.78rem; color:var(--muted); margin-top:5px; line-height:1.55;">${factor.description}</p>
            </div>
        `,
    );
  });

  // Others row
  const othersDisplay = Math.min(Math.max(othersSum, 5), 40);
  document.getElementById("xai-others-pct").textContent =
    othersDisplay + "% kontribusi rata-rata";

  // Natural language insight
  const topFactor = top3[0];
  const secondFactor = top3[1];
  const insightEl = document.getElementById("xai-insight");
  insightEl.style.borderLeftColor = rec.accentColor;
  insightEl.innerHTML = `
        <strong style="color:var(--moon);">💬 Ringkasan Keputusan Model:</strong><br>
        ${rec.insightPrefix} <strong style="color:${rec.accentColor};">${topFactor.name}</strong> 
        (${topFactor.value}), diikuti <strong>${secondFactor.name}</strong> (${secondFactor.value}). 
        ${
          top3Normalized[0].display >= 70
            ? "Faktor ini dominan dan menjadi penentu utama keputusan model."
            : "Keputusan model merupakan hasil kombinasi dari beberapa faktor yang saling memperkuat."
        }
    `;

  // Show card
  card.style.display = "block";

  // Animate bars after render
  setTimeout(() => {
    document.querySelectorAll(".xai-bar-fill").forEach((bar) => {
      bar.style.width = bar.dataset.width + "%";
    });
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

/* ── USER INIT ── */
function initUser() {
  var user = { name: "Pengguna", email: "" };
  try {
    var stored = sessionStorage.getItem("rs_user");
    if (stored) user = JSON.parse(stored);
  } catch (e) {}

  var name = user.name || "Pengguna";
  var parts = name.trim().split(" ");
  var initials =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : name.slice(0, 2);

  const el = {
    initials: document.getElementById("profile-initials"),
    name: document.getElementById("profile-name"),
    email: document.getElementById("profile-email"),
    joined: document.getElementById("profile-joined"),
  };

  if (el.initials) el.initials.textContent = initials.toUpperCase();
  if (el.name) el.name.textContent = name;
  if (el.email) el.email.textContent = user.email || "";
  if (el.joined) {
    el.joined.textContent = new Date().toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  }
}

/* ── FORM SUBMIT ── */
/* ── FORM SUBMIT ── */
document.addEventListener("DOMContentLoaded", function () {
  initUser();
  renderHistory(loadHistory());

  var form = document.getElementById("predict-form");
  if (!form) return;

  // Pastikan array requiredFields didefinisikan agar tidak memicu error saat validasi
  const requiredFields = [
    "age",
    "gender",
    "sleep_duration",
    "quality_of_sleep",
    "physical_activity",
    "stress_level",
    "bmi",
    "systolic",
    "diastolic",
    "heart_rate",
    "daily_steps",
  ];

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Reset styling error sebelum validasi ulang
    requiredFields.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.borderColor = "";
    });

    // Validasi input kosong
    var emptyFields = requiredFields.filter(function (id) {
      var el = document.getElementById(id);
      return !el || el.value === "" || el.value === null;
    });

    if (emptyFields.length > 0) {
      emptyFields.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.style.borderColor = "#d98080";
      });
      var firstEl = document.getElementById(emptyFields[0]);
      if (firstEl) {
        firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
        firstEl.focus();
      }
      return;
    }

    const currentUser = JSON.parse(sessionStorage.getItem("rs_user"));
    const userId = currentUser ? currentUser.id : null;

    const systolicVal = document.getElementById("systolic").value;
    const diastolicVal = document.getElementById("diastolic").value;
    const bloodPressureString = `${systolicVal}/${diastolicVal}`;

    const data = {
      user_id: userId,
      age: document.getElementById("age").value,
      gender: document.getElementById("gender").value,
      sleep_duration: document.getElementById("sleep_duration").value,
      quality_of_sleep: document.getElementById("quality_of_sleep").value,
      physical_activity: document.getElementById("physical_activity").value,
      stress_level: document.getElementById("stress_level").value,
      bmi: document.getElementById("bmi").value,
      blood_pressure: bloodPressureString,
      systolic: systolicVal,
      diastolic: diastolicVal,
      heart_rate: document.getElementById("heart_rate").value,
      daily_steps: document.getElementById("daily_steps").value,
      date: new Date().toISOString(),
    };

    // Ubah status tombol menjadi loading
    var submitBtn = form.querySelector('button[type="submit"]');
    var originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Menganalisis...";
    submitBtn.disabled = true;

    try {
      const response = await fetch(
        "sadar-sleep-disorder-predictor-with-xai-production.up.railway.app/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const resData = await response.json();

      if (resData.status === "success") {
        var result = resData.prediction;
        data.result = result;

        var history = loadHistory();
        history.push(data);
        saveHistory(history);
        renderHistory(history);

        renderResult(result, data);
      } else {
        alert("Error dari model: " + (resData.message || "Unknown error"));
      }
    } catch (error) {
      console.error("API Error:", error);
      alert(
        "Gagal terhubung ke model AI. Pastikan file app.py sedang berjalan di terminal.",
      );
    } finally {
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;
    }
  });
});
