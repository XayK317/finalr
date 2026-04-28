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

  saveToDisk() {
    localStorage.setItem("medivault_data", JSON.stringify(this.categories));
  }

  loadFromDisk() {
    const saved = localStorage.getItem("medivault_data");
    if (saved) {
      this.categories = JSON.parse(saved);
    }
  }

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

  // --- NEW: DYNAMIC UPDATE ENGINE ---
  // Handles facility renaming AND individual record editing
  updateEntry(cIdx, rId, field, newValue) {
    if (rId === null) {
      // Renaming the Doctor/Facility
      this.categories[cIdx].doctor = newValue;
    } else {
      // Updating a specific record detail
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

      // Facility Header (Editable)
      tab.innerHTML = `
                <div class="tab-controls">
                    <h3 contenteditable="true" 
                        onblur="vault.updateEntry(${cIdx}, null, 'doctor', this.innerText)">${cat.doctor}</h3>
                    <input type="color" value="${cat.color}" onchange="vault.categories[${cIdx}].color = this.value; vault.saveToDisk(); vault.render()">
                    <button class="btn-del" onclick="vault.categories.splice(${cIdx}, 1); vault.saveToDisk(); vault.render()">Delete Tab</button>
                </div>
            `;

      filteredRecords.forEach((rec) => {
        const item = document.createElement("div");
        item.className = "record-item";
        item.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <strong contenteditable="true" 
                                onblur="vault.updateEntry(${cIdx}, ${rec.id}, 'title', this.innerText)">${rec.title}</strong>
                        <button class="btn-del" onclick="vault.deleteRecord(${cIdx}, ${rec.id})">Remove</button>
                    </div>
                    <p contenteditable="true" 
                       onblur="vault.updateEntry(${cIdx}, ${rec.id}, 'notes', this.innerText)">${rec.notes}</p>
                    <small>Date: ${rec.date}</small>
                    ${rec.image ? `<img src="${rec.image}" style="max-width:200px; display:block; margin-top:10px; border-radius:4px;">` : ""}
                `;
        tab.appendChild(item);
      });
      container.appendChild(tab);
    });
  }
}

// ... (Keep the Login, Search, and File Handlers from previous code) ...
const vault = new VaultManager();
let currentImg = null;

document.getElementById("login-btn").addEventListener("click", () => {
  if (
    document.getElementById("username").value === "Harry.medivault" &&
    document.getElementById("password").value === "med4me"
  ) {
    gsap.to("#login-overlay", {
      yPercent: -100,
      duration: 0.8,
      ease: "expo.inOut",
      onComplete: () => {
        document.getElementById("main-app").style.display = "block";
        vault.render();
      },
    });
  }
});

document.getElementById("vault-search").addEventListener("input", (e) => {
  vault.searchTerm = e.target.value;
  vault.render();
});

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
});

// File Handlers (Keep the handleFile logic from before)
