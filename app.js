(function () {
  // ========== DOM элементы ==========
  const geoBtn = document.getElementById("geoBtn");
  const cityDisplay = document.getElementById("cityDisplay");
  const manualCityInput = document.getElementById("manualCityInput");
  const nextPrayerLabel = document.getElementById("nextPrayerLabel");
  const countdownDisplay = document.getElementById("countdownDisplay");
  const countdownRing = document.getElementById("countdownRing");
  const nextTimeDisplay = document.getElementById("nextTimeDisplay");
  const prayerListEl = document.getElementById("prayerList");
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");
  const themeToggle = document.getElementById("themeToggle");
  const shareBtn = document.getElementById("shareBtn");

  // ========== Глобальные переменные ==========
  const params = adhan.CalculationMethod.MuslimWorldLeague();
  params.madhab = adhan.Madhab.Shafi;
  let currentCoords = { latitude: 21.4225, longitude: 39.8262 }; // Мекка по умолчанию
  let prayerTimes = null;
  let countdownInterval = null;
  let nextPrayerName = "";

  // ========== Частицы на canvas ==========
  const canvas = document.getElementById("particles-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.2;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (
        this.x < 0 ||
        this.x > canvas.width ||
        this.y < 0 ||
        this.y > canvas.height
      ) {
        this.reset();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240, 196, 90, ${this.opacity})`;
      ctx.fill();
    }
  }
  for (let i = 0; i < 70; i++) {
    particles.push(new Particle());
  }
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // ========== Функции для времени намаза ==========
  function calculatePrayerTimes() {
    const date = new Date();
    const coords = new adhan.Coordinates(
      currentCoords.latitude,
      currentCoords.longitude,
    );
    return new adhan.PrayerTimes(coords, date, params);
  }

  function updateDisplay() {
    if (!currentCoords.latitude || !currentCoords.longitude) return;
    prayerTimes = calculatePrayerTimes();
    if (!prayerTimes) return;

    const now = new Date();
    const prayers = [
      {
        key: "fajr",
        name: "Фаджр",
        icon: '<i class="fa-solid fa-mountain-sun"></i>',
        time: prayerTimes.fajr,
      },
      {
        key: "sunrise",
        name: "Восход",
        icon: '<i class="fa-solid fa-mountain-sun"></i>',
        time: prayerTimes.sunrise,
        isSunrise: true,
      },
      {
        key: "dhuhr",
        name: "Зухр",
        icon: '<i class="fa-solid fa-sun"></i>',
        time: prayerTimes.dhuhr,
      },
      {
        key: "asr",
        name: "Аср",
        icon: '<i class="fa-solid fa-cloud-sun"></i>',
        time: prayerTimes.asr,
      },
      {
        key: "maghrib",
        name: "Магриб",
        icon: '<i class="fa-solid fa-mountain-sun"></i>',
        time: prayerTimes.maghrib,
      },
      {
        key: "isha",
        name: "Иша",
        icon: '<i class="fa-solid fa-moon"></i>',
        time: prayerTimes.isha,
      },
    ];

    // Найти следующий намаз (не Восход, если он прошёл, то следующий после него)
    let upcomingIndex = -1;
    for (let i = 0; i < prayers.length; i++) {
      if (prayers[i].time > now) {
        upcomingIndex = i;
        break;
      }
    }
    // Если все прошли, берём завтрашний фаджр
    let targetTime;
    if (upcomingIndex === -1) {
      nextPrayerName = "Фаджр (завтра)";
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowCoords = new adhan.Coordinates(
        currentCoords.latitude,
        currentCoords.longitude,
      );
      const tomorrowTimes = new adhan.PrayerTimes(
        tomorrowCoords,
        tomorrow,
        params,
      );
      targetTime = tomorrowTimes.fajr;
    } else {
      const next = prayers[upcomingIndex];
      nextPrayerName = next.name;
      targetTime = next.time;
    }

    nextPrayerLabel.textContent = `Следующий: ${nextPrayerName}`;
    nextTimeDisplay.textContent = targetTime
      ? `В ${targetTime.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`
      : "";

    // Запуск обратного отсчёта
    if (countdownInterval) clearInterval(countdownInterval);
    function tick() {
      const now = new Date();
      const diff = targetTime - now;
      if (diff <= 0) {
        countdownDisplay.textContent = "00:00:00";
        clearInterval(countdownInterval);
        // вибрация при наступлении
        if (navigator.vibrate) navigator.vibrate(200);
        updateDisplay(); // пересчитать
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      countdownDisplay.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

      // Мерцание и класс urgent если меньше 5 минут
      if (diff < 300000) {
        countdownRing.classList.add("urgent");
      } else {
        countdownRing.classList.remove("urgent");
      }
    }
    tick();
    countdownInterval = setInterval(tick, 1000);

    // Отрисовка списка
    prayerListEl.innerHTML = prayers
      .map((p, idx) => {
        const isPast = p.time < now;
        const isNext = idx === upcomingIndex && !isPast;
        const timeStr = p.time.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        });
        // класс urgent-blink если это следующий и до него <5 мин
        let extraClass = "";
        if (isNext && targetTime && targetTime - now < 300000) {
          extraClass = "urgent-blink";
        }
        return `
            <div class="prayer-item ${isPast ? "past" : ""} ${isNext ? "next" : ""} ${extraClass}">
              <span class="prayer-icon">${p.icon}</span>
              <div class="prayer-info">
                <div class="prayer-name">${p.name} ${p.isSunrise ? "(не намаз)" : ""}</div>
                <div class="prayer-sub">${p.isSunrise ? "время восхода" : ""}</div>
              </div>
              <span class="prayer-time">${timeStr}</span>
            </div>
          `;
      })
      .join("");

    // Прогресс: сколько обязательных намазов прошло (Фаджр, Зухр, Аср, Магриб, Иша)
    const mandatory = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    let completed = 0;
    mandatory.forEach((key) => {
      const p = prayers.find((p) => p.key === key);
      if (p && p.time <= now) completed++;
    });
    progressText.textContent = `${completed}/5`;
    progressFill.style.width = `${(completed / 5) * 100}%`;
  }

  // ========== Геолокация и определение города ==========
  async function reverseGeocode(lat, lon) {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`,
      );
      const data = await resp.json();
      if (data && data.address) {
        const city =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.county ||
          data.address.state ||
          "Неизвестно";
        return city;
      }
    } catch (e) {
      /* fallback */
    }
    return "Местоположение";
  }

  async function setLocationFromCoords(lat, lon, source = "geo") {
    currentCoords = { latitude: lat, longitude: lon };
    updateDisplay();
    if (source === "geo") {
      const city = await reverseGeocode(lat, lon);
      cityDisplay.textContent = city;
      manualCityInput.classList.remove("active");
      geoBtn.style.display = "none";
    }
  }

  geoBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается браузером.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await setLocationFromCoords(
          pos.coords.latitude,
          pos.coords.longitude,
          "geo",
        );
      },
      (err) => {
        console.warn(err);
        alert("Не удалось получить геолокацию. Введите город вручную.");
        manualCityInput.classList.add("active");
        manualCityInput.focus();
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );
  });

  manualCityInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      const query = manualCityInput.value.trim();
      if (!query) return;
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=ru`,
        );
        const data = await resp.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          await setLocationFromCoords(
            parseFloat(lat),
            parseFloat(lon),
            "manual",
          );
          cityDisplay.textContent = data[0].display_name.split(",")[0];
          manualCityInput.classList.remove("active");
        } else {
          alert("Город не найден. Попробуйте другое название.");
        }
      } catch (err) {
        alert("Ошибка поиска. Проверьте интернет.");
      }
    }
  });

  // Если геолокация уже была разрешена ранее — попробовать тихо получить координаты
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocationFromCoords(pos.coords.latitude, pos.coords.longitude, "geo"),
      () => {},
      { maximumAge: 600000, timeout: 3000 },
    );
  } else {
    // Без геолокации показываем Мекку
    updateDisplay();
  }

  // ========== Переключение темы ==========
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    if (document.body.classList.contains("light")) {
      themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i> Тёмная тема';
    } else {
      themeToggle.innerHTML =
        '<i class="fa-solid fa-brightness"></i> Светлая тема';
    }
  });

  // ========== Поделиться ==========
  shareBtn.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Zamzam Time — расписание намазов",
          text: `Расписание намазов для ${cityDisplay.textContent || "моего города"}.`,
          url: window.location.href,
        });
      } catch (err) {
        /* отмена */
      }
    } else {
      alert(
        'Функция "Поделиться" не поддерживается браузером. Скопируйте ссылку.',
      );
    }
  });

  // ========== Регистрация Service Worker ==========
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("sw.js")
        .catch((err) => console.log("SW error", err));
    });
  }

  // ========== Обновление раз в минуту на всякий случай ==========
  setInterval(updateDisplay, 60000);
})();
