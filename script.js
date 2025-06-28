// 🎯 DOM References
const nameInput = document.getElementById('nameInput');
const resultContainer = document.getElementById('resultContainer');
const personImage = document.getElementById('personImage');
const personName = document.getElementById('personName');
const dob = document.getElementById('dob');
const profession = document.getElementById('profession');
const bioSummary = document.getElementById('bioSummary');
const fullBio = document.getElementById('fullBio');
const hindiBio = document.getElementById('hindiBio');
const errorBlock = document.getElementById('errorBlock');
const spinner = document.getElementById('spinner');
const historyList = document.getElementById('historyList');
const readMoreBtn = document.getElementById('readMoreBtn');

// 🌙 Toggle Dark Mode
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode');
}

// 🌀 Spinner
function showSpinner() {
  spinner.classList.remove('hidden');
}
function hideSpinner() {
  spinner.classList.add('hidden');
}

// ❌ Error Handling
function showError(msg) {
  errorBlock.innerText = msg;
  errorBlock.classList.remove('hidden');
}
function hideError() {
  errorBlock.classList.add('hidden');
}

// 📂 Search History
function updateHistory(name) {
  let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
  if (!history.includes(name)) {
    history.unshift(name);
    if (history.length > 5) history.pop();
    localStorage.setItem('searchHistory', JSON.stringify(history));
  }
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
  const historyBox = document.getElementById('historyBox');
  const clearBtn = document.querySelector('.clear-btn');

  if (history.length === 0) {
    historyBox.classList.add('hidden');
    return;
  }

  historyBox.classList.remove('hidden');
  historyList.innerHTML = history.map((name, index) =>
    `<li onclick="loadFromHistory('${name}')">
      ${name}
      <button class="delete-btn" onclick="event.stopPropagation(); deleteHistoryItem(${index})">🗑️</button>
    </li>`
  ).join('');

  if (clearBtn) {
    clearBtn.style.display = history.length > 0 ? 'inline-block' : 'none';
  }
}

function deleteHistoryItem(index) {
  let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
  history.splice(index, 1);
  localStorage.setItem('searchHistory', JSON.stringify(history));
  renderHistory();
}

function clearHistory() {
  if (confirm("Are you sure you want to clear all search history?")) {
    localStorage.removeItem('searchHistory');
    renderHistory();
  }
}

function loadFromHistory(name) {
  nameInput.value = name;
  searchBio();
}

// 📚 Fetch Bio Summary
async function searchBio() {
  const name = nameInput.value.trim();
  if (!name) return showError("Please enter a name!");

  hideError();
  showSpinner();

  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;

  try {
    const res = await fetch(summaryUrl);
    const data = await res.json();

    if (data.extract) {
      personName.innerText = data.title || name;
      bioSummary.innerText = data.extract;
      personImage.src = data.thumbnail?.source || 'https://via.placeholder.com/150';
      profession.innerText = data.description || "N/A";
      resultContainer.classList.remove('hidden');
      fullBio.classList.add('hidden');
      hindiBio.classList.add('hidden');
      readMoreBtn.innerText = "📖 Read More";
      updateHistory(name);

      // ✅ Fetch DOB from Parse API
      const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(data.title)}&format=json&origin=*`;
      const parseRes = await fetch(parseUrl);
      const parseData = await parseRes.json();

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = parseData.parse.text["*"];

      const infobox = tempDiv.querySelector(".infobox");
      let dobText = "N/A";

      if (infobox) {
        const dobRow = [...infobox.querySelectorAll("tr")].find(row =>
          row.textContent.toLowerCase().includes("born")
        );
        if (dobRow) {
          dobText = dobRow.textContent.replace("Born", "").trim();
        }
      }

      dob.innerText = dobText;

    } else {
      showError("No biography found.");
    }
  } catch (err) {
    console.error(err);
    showError("Error fetching data.");
  } finally {
    hideSpinner();
  }
}

// 📖 Read More Toggle
readMoreBtn.addEventListener("click", async () => {
  if (!fullBio.classList.contains('hidden')) {
    fullBio.classList.add('hidden');
    readMoreBtn.innerText = "📖 Read More";
    return;
  }

  showSpinner();
  const fullText = await fetchFullWikipediaPage(personName.innerText);
  fullBio.innerText = fullText;
  fullBio.classList.remove('hidden');
  readMoreBtn.innerText = "❌ Hide Full Bio";
  hideSpinner();
});

// 📄 Fetch Full Wikipedia Page
async function fetchFullWikipediaPage(title) {
  const response = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&origin=*`);
  const data = await response.json();
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = data.parse.text["*"];
  const paragraphs = tempDiv.querySelectorAll("p");
  return Array.from(paragraphs).map(p => p.innerText).join("\n\n").trim();
}

// 🌐 Translate to Hindi
async function translateToHindi() {
  const text = bioSummary.innerText.trim();
  if (!text) return showError("Nothing to translate.");

  showSpinner();
  hideError();

  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      body: JSON.stringify({
        q: text.slice(0, 4500),
        source: "en",
        target: "hi",
        format: "text"
      }),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    hindiBio.innerText = data.translatedText || "अनुवाद नहीं हो पाया।";
    hindiBio.classList.remove('hidden');
  } catch {
    showError("Translation failed. Try again.");
  } finally {
    hideSpinner();
  }
}

// 🎤 Voice Input
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();
  recognition.onresult = (event) => {
    const spoken = event.results[0][0].transcript;
    nameInput.value = spoken;
    searchBio();
  };
}

// 📥 Download PDF
async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(`Name: ${personName.innerText}`, 10, 10);
  doc.text(`DOB: ${dob.innerText}`, 10, 20);
  doc.text(`Profession: ${profession.innerText}`, 10, 30);
  doc.text("Biography:", 10, 40);
  doc.text(doc.splitTextToSize(bioSummary.innerText, 180), 10, 50);
  doc.save(`${personName.innerText}_bio.pdf`);
}

// 🚀 On Page Load
window.onload = () => {
  renderHistory();
};
