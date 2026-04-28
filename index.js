// --- 1. OOP CLASSES ---
class MedicalRecord {
  constructor(title, date, notes, image, id = Date.now()) {
    this.id = id;
    this.title = title;
    this.date = date;
    this.notes = notes;
    this.image = image;
  }
}

class Category {
  constructor(doctor, color = "#3498db") {
    this.doctor = doctor;
    this.color = color;
    this.records = [];
  }
}

class VaultManager {
  constructor() {
    this.categories = [];
    this.searchTerm = "";
    this.loadFromDisk();
  }

  // --- DATA PERSISTENCE ---
  saveToDisk() {
    localStorage.setItem("medivault_data", JSON.stringify(this.categories));
  }

  loadFromDisk() {
    const saved = localStorage.getItem("medivault_data");
    if (saved) {
      this.categories = JSON.parse(saved);
    }
  }

  // --- CORE ACTIONS ---
  addRecord(data) {
    let cat = this.categories.find(
      (c) => c.doctor.toLowerCase() === data.doctor.toLowerCase(),
    );
    if (!cat) {
      cat = new Category(data.doctor);
      this.categories.unshift(cat);
    } else {
      const idx = this.categories.indexOf(cat);
      this.categories.splice(idx, 1);
      this.categories.unshift(cat);
    }
    cat.records.unshift(
      new MedicalRecord(data.title, data.date, data.notes, data.image),
    );
    this.saveToDisk();
    this.render();
  }

  updateEntry(cIdx, rId, field, newValue) {
    if (rId === null) {
      this.categories[cIdx].doctor = newValue;
    } else {
      const rec = this.categories[cIdx].records.find((r) => r.id === rId);
      if (rec) rec[field] = newValue;
    }
    this.saveToDisk();
  }

  deleteRecord(cIdx, rId) {
    this.categories[cIdx].records = this.categories[cIdx].records.filter(
      (r) => r.id !== rId,
    );
    if (this.categories[cIdx].records.length === 0)
      this.categories.splice(cIdx, 1);
    this.saveToDisk();
    this.render();
  }

  moveTab(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < this.categories.length) {
      [this.categories[index], this.categories[newIndex]] = [
        this.categories[newIndex],
        this.categories[index],
      ];
      this.saveToDisk();
      this.render();
    }
  }

  render() {
    const container = document.getElementById("category-container");
    container.innerHTML = "";
    const search = this.searchTerm.toLowerCase();

    this.categories.forEach((cat, cIdx) => {
      const filteredRecords = cat.records.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          r.notes.toLowerCase().includes(search) ||
          cat.doctor.toLowerCase().includes(search),
      );

      if (search && filteredRecords.length === 0) return;

      const tab = document.createElement("div");
      tab.className = "doctor-tab";
      tab.style.borderLeftColor = cat.color;

      tab.innerHTML = `
                <div class="tab-controls">
                    <div class="move-btns">
                        <button class="move-btn" onclick="vault.moveTab(${cIdx}, -1)">↑</button>
                        <button class="move-btn" onclick="vault.moveTab(${cIdx}, 1)">↓</button>
                    </div>
                    <h3 contenteditable="true" onblur="vault.updateEntry(${cIdx}, null, 'doctor', this.innerText)">${cat.doctor}</h3>
                    <input type="color" value="${cat.color}" onchange="vault.categories[${cIdx}].color = this.value; vault.saveToDisk(); vault.render()">
                    <button class="btn-del" onclick="vault.categories.splice(${cIdx}, 1); vault.saveToDisk(); vault.render()">Delete Tab</button>
                </div>
            `;

      filteredRecords.forEach((rec) => {
        const item = document.createElement("div");
        item.className = "record-item";
        item.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <strong contenteditable="true" onblur="vault.updateEntry(${cIdx}, ${rec.id}, 'title', this.innerText)">${rec.title}</strong>
                        <button class="btn-del" onclick="vault.deleteRecord(${cIdx}, ${rec.id})">Remove</button>
                    </div>
                    <p contenteditable="true" onblur="vault.updateEntry(${cIdx}, ${rec.id}, 'notes', this.innerText)">${rec.notes}</p>
                    <small>Date: ${rec.date}</small>
                    ${rec.image ? `<img src="${rec.image}" class="vault-img">` : ""}
                `;
        tab.appendChild(item);
      });
      container.appendChild(tab);
    });
  }
}

// --- INITIALIZATION ---
const vault = new VaultManager();
let currentImg = null;

// Auth with Incorrect Login feedback
document.getElementById("login-btn").addEventListener("click", () => {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;

  if (u === "Harry.medivault" && p === "med4me") {
    gsap.to("#login-overlay", {
      yPercent: -100,
      duration: 0.8,
      ease: "expo.inOut",
      onComplete: () => {
        document.getElementById("main-app").style.display = "block";
        vault.render();
      },
    });
  } else {
    // Show error message and add shake effect
    document.getElementById("login-error").style.display = "block";
    gsap.to(".login-card", { x: 10, repeat: 3, yoyo: true, duration: 0.08 });
  }
});

// Search
document.getElementById("vault-search").addEventListener("input", (e) => {
  vault.searchTerm = e.target.value;
  vault.render();
});

// Form Submissions
document.getElementById("record-form").addEventListener("submit", (e) => {
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
  document.getElementById("drop-zone").querySelector("p").style.display =
    "block";
});

// --- MULTIMEDIA: DRAG & DROP LOGIC ---
const dz = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");

dz.addEventListener("click", () => fileInput.click());

["dragenter", "dragover", "dragleave", "drop"].forEach((name) => {
  dz.addEventListener(
    name,
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    false,
  );
});

["dragenter", "dragover"].forEach((name) => {
  dz.addEventListener(name, () => dz.classList.add("active"), false);
});
["dragleave", "drop"].forEach((name) => {
  dz.addEventListener(name, () => dz.classList.remove("active"), false);
});

dz.addEventListener("drop", (e) => {
  const files = e.dataTransfer.files;
  if (files.length > 0) handleFile(files[0]);
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

function handleFile(file) {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      currentImg = ev.target.result;
      const pre = document.getElementById("preview-img");
      pre.src = currentImg;
      pre.style.display = "block";
      dz.querySelector("p").style.display = "none";
    };
    reader.readAsDataURL(file);
  }
}
