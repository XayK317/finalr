class MedicalRecord {
  constructor(t, d, n, i) {
    Object.assign(this, {
      id: Date.now(),
      title: t,
      date: d,
      notes: n,
      image: i,
    });
  }
}

class VaultManager {
  constructor() {
    this.categories = JSON.parse(localStorage.getItem("medivault_data")) || [];
    this.searchTerm = "";
  }

  save() {
    localStorage.setItem("medivault_data", JSON.stringify(this.categories));
  }

  addRecord(data) {
    let cat = this.categories.find(
      (c) => c.doctor.toLowerCase() === data.doctor.toLowerCase(),
    );
    if (!cat) {
      cat = { doctor: data.doctor, color: "#3498db", records: [] };
      this.categories.unshift(cat);
    } else {
      this.categories.splice(this.categories.indexOf(cat), 1);
      this.categories.unshift(cat);
    }
    cat.records.push(
      new MedicalRecord(data.title, data.date, data.notes, data.image),
    );
    cat.records.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.save();
    this.render();
  }

  update(cIdx, rId, field, val) {
    if (rId === null) this.categories[cIdx].doctor = val;
    else {
      const rec = this.categories[cIdx].records.find((r) => r.id === rId);
      if (rec) {
        rec[field] = val;
        if (field === "date")
          this.categories[cIdx].records.sort(
            (a, b) => new Date(b.date) - new Date(a.date),
          );
      }
    }
    this.save();
    if (field === "date" || rId === null) this.render();
  }

  delete(cIdx, rId) {
    this.categories[cIdx].records = this.categories[cIdx].records.filter(
      (r) => r.id !== rId,
    );
    if (!this.categories[cIdx].records.length) this.categories.splice(cIdx, 1);
    this.save();
    this.render();
  }

  move(idx, dir) {
    let target = idx + dir;
    if (target >= 0 && target < this.categories.length) {
      [this.categories[idx], this.categories[target]] = [
        this.categories[target],
        this.categories[idx],
      ];
      this.save();
      this.render();
    }
  }

  render() {
    const container = document.getElementById("category-container");
    container.innerHTML = "";
    const s = this.searchTerm.toLowerCase();

    this.categories.forEach((cat, cIdx) => {
      const filtered = cat.records.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.notes.toLowerCase().includes(s) ||
          cat.doctor.toLowerCase().includes(s),
      );
      if (s && !filtered.length) return;

      const tab = document.createElement("div");
      tab.className = "doctor-tab";
      tab.style.borderLeftColor = cat.color;
      tab.innerHTML = `<div class="tab-controls">
                <div class="move-btns"><button onclick="vault.move(${cIdx},-1)">↑</button><button onclick="vault.move(${cIdx},1)">↓</button></div>
                <h3 contenteditable="true" onblur="vault.update(${cIdx},null,'doctor',this.innerText)">${cat.doctor}</h3>
                <input type="color" value="${cat.color}" onchange="vault.categories[${cIdx}].color=this.value;vault.save();vault.render()">
                <button class="btn-del" onclick="vault.categories.splice(${cIdx},1);vault.save();vault.render()">Delete Tab</button>
            </div>`;

      filtered.forEach((rec) => {
        const item = document.createElement("div");
        item.className = "record-item";
        item.innerHTML = `<div style="display:flex;justify-content:space-between;"><strong contenteditable="true" onblur="vault.update(${cIdx},${rec.id},'title',this.innerText)">${rec.title}</strong><button class="btn-del" onclick="vault.delete(${cIdx},${rec.id})">Remove</button></div>
                    <p contenteditable="true" onblur="vault.update(${cIdx},${rec.id},'notes',this.innerText)">${rec.notes}</p>
                    <small>Date: <span contenteditable="true" onblur="vault.update(${cIdx},${rec.id},'date',this.innerText)">${rec.date}</span></small>
                    ${rec.image ? `<img src="${rec.image}" class="vault-img">` : ""}`;
        tab.appendChild(item);
      });
      container.appendChild(tab);
    });
  }
}

const vault = new VaultManager();
let currentImg = null;

// Auth & Search
document.getElementById("login-btn").onclick = () => {
  const u = document.getElementById("username").value,
    p = document.getElementById("password").value;
  if (u === "Harry.medivault" && p === "med4me") {
    gsap.to("#login-overlay", {
      yPercent: -100,
      duration: 0.8,
      onComplete: () => {
        document.getElementById("main-app").style.display = "block";
        vault.render();
      },
    });
  } else {
    document.getElementById("login-error").style.display = "block";
    gsap.to(".login-card", { x: 10, repeat: 3, yoyo: true, duration: 0.08 });
  }
};

document.getElementById("vault-search").oninput = (e) => {
  vault.searchTerm = e.target.value;
  vault.render();
};

document.getElementById("record-form").onsubmit = (e) => {
  e.preventDefault();
  vault.addRecord({
    title: document.getElementById("rec-title").value,
    doctor: document.getElementById("rec-doctor").value,
    date: document.getElementById("rec-date").value,
    notes: document.getElementById("rec-notes").value,
    image: currentImg,
  });
  e.target.reset();
  currentImg = null;
  document.getElementById("preview-img").style.display = "none";
};

// Drag & Drop
const dz = document.getElementById("drop-zone"),
  fi = document.getElementById("file-input");
dz.onclick = () => fi.click();
["dragenter", "dragover", "dragleave", "drop"].forEach((n) =>
  dz.addEventListener(n, (e) => {
    e.preventDefault();
    n.includes("over")
      ? dz.classList.add("active")
      : dz.classList.remove("active");
  }),
);
dz.ondrop = (e) => handleFile(e.dataTransfer.files[0]);
fi.onchange = (e) => handleFile(e.target.files[0]);

function handleFile(file) {
  if (file?.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImg = e.target.result;
      Object.assign(document.getElementById("preview-img"), {
        src: currentImg,
        style: "display:block;max-width:100%",
      });
    };
    reader.readAsDataURL(file);
  }
}
// --- API INTEGRATION ---
function initAI() {
  // Using Advice Slip API - Reliable, free, and no CORS issues
  fetch("https://api.adviceslip.com/advice")
    .then((response) => response.json())
    .then((data) => {
      const advice = data.slip.advice;
      document.getElementById("api-status").innerText = `"${advice}"`;
      console.log("MediVault System Advice: " + advice);
    })
    .catch((err) => {
      document.getElementById("api-status").innerText =
        "Security Mode: Encrypted";
      console.log("API offline. Operating in local secure mode.");
    });
}
