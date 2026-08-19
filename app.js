const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");
const loginForm = document.getElementById("loginForm");
const transactionForm = document.getElementById("transactionForm");
const body = document.getElementById("transactionBody");
const search = document.getElementById("search");
const emptyState = document.getElementById("emptyState");

let transactions = JSON.parse(
  localStorage.getItem("posTransactions") || "[]"
);

function money(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN"
  }).format(Number(amount) || 0);
}

function saveTransactions() {
  localStorage.setItem(
    "posTransactions",
    JSON.stringify(transactions)
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loggedIn() {
  return sessionStorage.getItem("posLoggedIn") === "yes";
}

function showApp() {
  loginPage.classList.add("hidden");
  appPage.classList.remove("hidden");
  document.getElementById("date").value = today();
  render();
}

function showLogin() {
  appPage.classList.add("hidden");
  loginPage.classList.remove("hidden");
}

if (loggedIn()) {
  showApp();
}

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document
    .getElementById("username")
    .value
    .trim();

  const password = document.getElementById("password").value;

  if (username === "admin" && password === "1234") {
    sessionStorage.setItem("posLoggedIn", "yes");
    document.getElementById("loginError").textContent = "";
    showApp();
  } else {
    document.getElementById("loginError").textContent =
      "Incorrect username or password.";
  }
});

document.getElementById("logoutBtn").addEventListener("click", function () {
  sessionStorage.removeItem("posLoggedIn");
  showLogin();
});

transactionForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const editId = document.getElementById("editId").value;

  const transaction = {
    id: editId || Date.now().toString(),
    date: document.getElementById("date").value,
    type: document.getElementById("type").value,
    amount: Number(document.getElementById("amount").value),
    reference: document.getElementById("reference").value.trim(),
    description: document
      .getElementById("description")
      .value
      .trim()
  };

  if (editId) {
    transactions = transactions.map(function (t) {
      return t.id === editId ? transaction : t;
    });
  } else {
    transactions.unshift(transaction);
  }

  saveTransactions();
  resetForm();
  render();
});

function resetForm() {
  transactionForm.reset();

  document.getElementById("editId").value = "";
  document.getElementById("date").value = today();

  document.getElementById("formTitle").textContent =
    "Add Transaction";

  document.getElementById("saveBtn").textContent =
    "Save Transaction";

  document.getElementById("cancelBtn").classList.add("hidden");
}

document.getElementById("cancelBtn").addEventListener(
  "click",
  resetForm
);

function editTransaction(id) {
  const transaction = transactions.find(function (t) {
    return t.id === id;
  });

  if (!transaction) return;

  document.getElementById("editId").value = transaction.id;
  document.getElementById("date").value = transaction.date;
  document.getElementById("type").value = transaction.type;
  document.getElementById("amount").value = transaction.amount;
  document.getElementById("reference").value =
    transaction.reference;
  document.getElementById("description").value =
    transaction.description;

  document.getElementById("formTitle").textContent =
    "Edit Transaction";

  document.getElementById("saveBtn").textContent =
    "Update Transaction";

  document.getElementById("cancelBtn").classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function deleteTransaction(id) {
  if (confirm("Delete this transaction?")) {
    transactions = transactions.filter(function (t) {
      return t.id !== id;
    });

    saveTransactions();
    render();
  }
}

function render() {
  const query = search.value.toLowerCase().trim();

  const filtered = transactions.filter(function (t) {
    return (
      `${t.reference} ${t.type} ${t.description}`
        .toLowerCase()
        .includes(query)
    );
  });

  body.innerHTML = "";

  filtered.forEach(function (t) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${t.date}</td>
      <td><span class="badge">${t.type}</span></td>
      <td>${money(t.amount)}</td>
      <td>${escapeHtml(t.reference)}</td>
      <td>${escapeHtml(t.description || "-")}</td>
      <td>
        <button class="edit"
          onclick="editTransaction('${t.id}')">
          Edit
        </button>

        <button class="danger"
          onclick="deleteTransaction('${t.id}')">
          Delete
        </button>
      </td>
    `;

    body.appendChild(row);
  });

  emptyState.classList.toggle(
    "hidden",
    filtered.length > 0
  );

  const total = transactions.reduce(function (sum, t) {
    return sum + t.amount;
  }, 0);

  const cashIn = transactions
    .filter(function (t) {
      return t.type === "Cash In";
    })
    .reduce(function (sum, t) {
      return sum + t.amount;
    }, 0);

  const cashOut = transactions
    .filter(function (t) {
      return (
        t.type === "Cash Out" ||
        t.type === "Withdrawal"
      );
    })
    .reduce(function (sum, t) {
      return sum + t.amount;
    }, 0);

  document.getElementById("totalCount").textContent =
    transactions.length;

  document.getElementById("totalAmount").textContent =
    money(total);

  document.getElementById("cashIn").textContent =
    money(cashIn);

  document.getElementById("cashOut").textContent =
    money(cashOut);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}

search.addEventListener("input", render);
