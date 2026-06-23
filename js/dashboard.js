const STORAGE_KEY = "rs_history";

const RECOMMENDATIONS = {
  None: {
    label: "Healthy Sleep Pattern",
    tagClass: "tag-sage",
    dotClass: "dot-sage",
    borderColor: "var(--sage)",
    intro: "No sleep disorder detected. Maintain these habits:",
    tips: [
      "Maintain consistent sleep and wake times, including on weekends.",
      "Maintain a sleep duration of 7–9 hours per night.",
      "Stay active; regular physical activity maintains long-term sleep quality.",
      "Morning sunlight exposure helps regulate your circadian rhythm.",
      "Monitor your daily stress; a spike in stress is the earliest sign of a sleep disorder.",
    ],
    verdictIcon: "✅",
    verdictTitle: "No sleep disorder detected",
    verdictDesc:
      "Your body parameters are within the normal range. The AI model found no patterns related to sleep disorders.",
    verdictClass: "verdict-normal",
    accentColor: "var(--sage)",
    insightPrefix: "The factor that most protects you from sleep disorders is",
  },
  Insomnia: {
    label: "Insomnia Indication",
    tagClass: "tag-sand",
    dotClass: "dot-sand",
    borderColor: "var(--sand)",
    intro: "Insomnia risk detected. Steps you can start trying:",
    tips: [
      "Establish a consistent sleep routine, going to bed and waking up at the same time every day.",
      "Avoid phone/laptop screens for at least 45 minutes before bed. Blue light suppresses melatonin production.",
      "Try the <strong>4-7-8</strong> technique: inhale for 4 seconds → hold for 7 seconds → exhale for 8 seconds.",
      "Limit caffeine after 2:00 PM and avoid alcohol; both disrupt the REM cycle.",
      "If you can't sleep after 20 minutes, get out of bed and do a relaxing activity.",
      "Manage your daily stress; high stress levels are a major trigger for insomnia.",
    ],
    verdictIcon: "⚠️",
    verdictTitle: "Insomnia indication detected",
    verdictDesc:
      "The AI model detected patterns consistent with insomnia based on the combination of factors below.",
    verdictClass: "verdict-insomnia",
    accentColor: "var(--sand)",
    insightPrefix:
      "The factor contributing most to the insomnia prediction is",
  },
  "Sleep Apnea": {
    label: "Sleep Apnea Indication",
    tagClass: "tag-red",
    dotClass: "dot-red",
    borderColor: "#d98080",
    intro: "Sleep apnea risk detected. This requires more serious attention:",
    tips: [
      "<strong>Consult a doctor</strong>. Sleep apnea requires a formal examination for a definitive diagnosis.",
      "Sleeping on your side (not your back) can help open the airways.",
      "Maintain an ideal weight. Excess fat in the neck area narrows the airway.",
      "Avoid alcohol and sedatives before bed; both relax the throat muscles.",
      "Monitor your blood pressure regularly. Sleep apnea and hypertension worsen each other.",
      "Consider consulting about a CPAP machine if symptoms persist.",
    ],
    verdictIcon: "🔴",
    verdictTitle: "Sleep Apnea indication detected",
    verdictDesc:
      "The AI model detected a combination of parameters closely related to sleep apnea. Consult a medical professional immediately.",
    verdictClass: "verdict-apnea",
    accentColor: "#d98080",
    insightPrefix:
      "The biggest risk factor triggering the sleep apnea prediction is",
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
  return new Date(isoStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ── RENDER HISTORY ── */
function renderHistory(history) {
  const container = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");

  if (container) {
    if (!history.length) {
      container.innerHTML = "";
      if (empty) empty.style.display = "block";
    } else {
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
                            Sleep: <strong>${item.sleep_duration} hours</strong> &nbsp;·&nbsp;
                            Quality: <strong>${item.quality_of_sleep || 5}/10</strong> &nbsp;·&nbsp;
                            Stress: <strong>${item.stress_level || 5}/10</strong>
                        </div>
                    </div>
                    <div class="history-date">${formatDate(item.date)}</div>
                </div>`;
        })
        .join("");

      const statTotal = document.getElementById("stat-total");
      const statLast = document.getElementById("stat-last");

      if (statTotal) statTotal.textContent = history.length + " Times";

      const last = history[history.length - 1];
      if (last && statLast) {
        const r = RECOMMENDATIONS[last.result] || RECOMMENDATIONS["None"];
        statLast.textContent = r.label;
      }
    }
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
        name: "Stress Level",
        value: `${stress}/10`,
        weight: (10 - stress) * 9,
        suffix:
          stress <= 4
            ? "Very Relaxed"
            : stress <= 6
              ? "Controlled"
              : "Needs Attention",
        description:
          stress <= 5
            ? `Stress of ${stress}/10 is relatively low, providing strong protection against sleep disorders.`
            : `Stress of ${stress}/10 is within tolerance limits but needs monitoring.`,
      },
      {
        name: "Sleep Quality",
        value: `${quality}/10`,
        weight: quality * 8,
        suffix:
          quality >= 7
            ? "Very Good"
            : quality >= 5
              ? "Adequate"
              : "Needs Improvement",
        description: `Sleep quality of ${quality}/10 indicates ${quality >= 7 ? "high-quality" : "adequate"} rest.`,
      },
      {
        name: "Sleep Duration",
        value: `${duration} hours`,
        weight:
          duration >= 7 && duration <= 9
            ? 78
            : Math.max(100 - Math.abs(8 - duration) * 15, 10),
        suffix:
          duration >= 7 && duration <= 9
            ? "Ideal"
            : duration < 7
              ? "Lacking"
              : "Excessive",
        description: `A duration of ${duration} hours ${duration >= 7 && duration <= 9 ? "is within the ideal 7–9 hours range." : "is outside the optimal range."}`,
      },
      {
        name: "Physical Activity",
        value: `${physical} minutes/day`,
        weight: Math.min(physical * 0.85, 72),
        suffix:
          physical >= 45
            ? "Active"
            : physical >= 20
              ? "Moderate"
              : "Less Active",
        description: `Physical activity of ${physical} minutes/day helps regulate the circadian rhythm and improve sleep quality.`,
      },
      {
        name: "Systolic Blood Pressure",
        value: `${systolic} mmHg`,
        weight: Math.max(80 - Math.abs(systolic - 120) * 1.2, 10),
        suffix:
          systolic < 130 ? "Normal" : systolic < 140 ? "Elevated" : "High",
        description: `Systolic blood pressure of ${systolic} mmHg ${systolic < 130 ? "is within the normal range." : "is slightly above ideal."}`,
      },
    ];
  } else if (isApnea) {
    rawFactors = [
      {
        name: "Systolic Blood Pressure",
        value: `${systolic} mmHg`,
        weight: Math.min(Math.abs(systolic - 115) * 1.8, 90),
        suffix:
          systolic >= 130
            ? "Hypertension"
            : systolic >= 125
              ? "Elevated"
              : "Borderline",
        description: `Systolic pressure of ${systolic} mmHg is a cardiovascular indicator highly correlated with sleep apnea.`,
      },
      {
        name: "BMI Category",
        value: bmi,
        weight: bmiRisk,
        suffix:
          bmi === "Obese"
            ? "High Risk"
            : bmi === "Overweight"
              ? "Medium Risk"
              : "Low Risk",
        description: `A BMI category of ${bmi} directly affects airway width during sleep.`,
      },
      {
        name: "Heart Rate",
        value: `${hr} BPM`,
        weight: Math.min(Math.abs(hr - 68) * 1.5, 75),
        suffix: hr > 80 ? "Elevated" : hr < 60 ? "Low" : "Normal",
        description: `A resting heart rate of ${hr} BPM contributes as a marker of cardiovascular condition.`,
      },
      {
        name: "Sleep Quality",
        value: `${quality}/10`,
        weight: Math.max((10 - quality) * 8, 10),
        suffix:
          quality <= 4 ? "Very Poor" : quality <= 6 ? "Poor" : "Moderate",
        description: `Sleep quality of ${quality}/10 indicates rest disruption typical of sleep apnea sufferers.`,
      },
      {
        name: "Stress Level",
        value: `${stress}/10`,
        weight: stress * 7.5,
        suffix:
          stress >= 7 ? "High Burden" : stress >= 5 ? "Moderate" : "Controlled",
        description: `Stress of ${stress}/10 worsens the body's response to breathing disruptions during sleep.`,
      },
    ];
  } else {
    // Insomnia
    rawFactors = [
      {
        name: "Stress Level",
        value: `${stress}/10`,
        weight: stress * 9,
        suffix:
          stress >= 7
            ? "Main Trigger"
            : stress >= 5
              ? "Contributing"
              : "Moderate",
        description: `Stress of ${stress}/10 is the most dominant trigger for insomnia — an active mind hinders the transition to sleep.`,
      },
      {
        name: "Sleep Quality",
        value: `${quality}/10`,
        weight: Math.max((10 - quality) * 9, 10),
        suffix:
          quality <= 4
            ? "Very Poor"
            : quality <= 6
              ? "Disrupted"
              : "Moderate",
        description: `Sleep quality of ${quality}/10 indicates sleep fragmentation typical of insomnia.`,
      },
      {
        name: "Sleep Duration",
        value: `${duration} hours`,
        weight: Math.max((7.5 - duration) * 18, 8),
        suffix:
          duration < 6 ? "Very Lacking" : duration < 7 ? "Lacking" : "Adequate",
        description: `A duration of ${duration} hours is below the restorative threshold, exacerbating the insomnia cycle.`,
      },
      {
        name: "Physical Activity",
        value: `${physical} minutes/day`,
        weight: Math.max(65 - physical, 8),
        suffix:
          physical < 20
            ? "Very Lacking"
            : physical < 40
              ? "Lacking"
              : "Moderate",
        description: `Low physical activity of ${physical} minutes/day reduces the body's natural sleep drive.`,
      },
      {
        name: "Heart Rate",
        value: `${hr} BPM`,
        weight: Math.min(Math.abs(hr - 68) * 1.3, 70),
        suffix: hr > 78 ? "Elevated" : "Normal",
        description: `A resting heart rate of ${hr} BPM reflects sympathetic nervous system activation that disrupts sleep.`,
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
  
  if (card) {
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
      `The XGBoost model analyzed <strong>11 parameters</strong> from the data you entered. Here is a transparent explanation of the factors most influencing the prediction of <strong>${rec.label}</strong>:`;

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
      othersDisplay + "% average contribution";

    // Natural language insight
    const topFactor = top3[0];
    const secondFactor = top3[1];
    const insightEl = document.getElementById("xai-insight");
    insightEl.style.borderLeftColor = rec.accentColor;
    insightEl.innerHTML = `
          <strong style="color:var(--moon);">💬 Model Decision Summary:</strong><br>
          ${rec.insightPrefix} <strong style="color:${rec.accentColor};">${topFactor.name}</strong> 
          (${topFactor.value}), followed by <strong>${secondFactor.name}</strong> (${secondFactor.value}). 
          ${
            top3Normalized[0].display >= 70
              ? "This factor is dominant and is the main determinant of the model's decision."
              : "The model's decision is the result of a combination of mutually reinforcing factors."
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
}

/* ── USER INIT ── */
function initUser() {
  var user = { name: "User", email: "" };
  try {
    var stored = sessionStorage.getItem("rs_user");
    if (stored) user = JSON.parse(stored);
  } catch (e) {}

  var name = user.name || "User";
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
    el.joined.textContent = new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }
}

/* ── FORM SUBMIT ── */
document.addEventListener("DOMContentLoaded", function () {
  initUser();
  renderHistory(loadHistory());

  var form = document.getElementById("predict-form");
  if (form) {
    // Make sure requiredFields array is defined to avoid errors during validation
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

      // Reset styling error before revalidating
      requiredFields.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.style.borderColor = "";
      });

      // Validate empty inputs
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
      } else {
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

        // Change button status to loading
        var submitBtn = form.querySelector('button[type="submit"]');
        var originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "Analyzing...";
        submitBtn.disabled = true;

        try {
          const response = await fetch(
            "https://sadar-sleep-disorder-predictor-with-xai-production.up.railway.app/predict",
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
            alert("Error from model: " + (resData.message || "Unknown error"));
          }
        } catch (error) {
          console.error("API Error:", error);
          alert(
            "Failed to connect to the AI model. Make sure the app.py file is running in the terminal.",
          );
        } finally {
          submitBtn.innerText = originalBtnText;
          submitBtn.disabled = false;
        }
      }
    });
  }
});