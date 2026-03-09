/* =======================
   بيانات التطبيق
======================= */
let incoming = [];
let outgoing = [];
let stock = [];

let editIncomingIndex = null;
let editOutgoingIndex = null;

let selectedIncoming = new Set();

let incomingPage = 1;
let incomingPerPage = 20;

let selectedOutgoing = new Set();

let outgoingPage = 1;
let outgoingPerPage = 20;

let selectedStock = new Set();

let stockPage = 1;
let stockPerPage = 20;
/* =======================
   تحميل البيانات
======================= */
window.onload = function () {
  loadLocal();
  recalcStock();
  showHome();
};

function loadLocal() {
  try {
    incoming = JSON.parse(localStorage.getItem("incoming")) || [];
    outgoing = JSON.parse(localStorage.getItem("outgoing")) || [];
    stock = JSON.parse(localStorage.getItem("stock")) || [];
  } catch (e) {
    incoming = [];
    outgoing = [];
    stock = [];
  }
}

function saveLocal() {
  localStorage.setItem("incoming", JSON.stringify(incoming));
  localStorage.setItem("outgoing", JSON.stringify(outgoing));
  localStorage.setItem("stock", JSON.stringify(stock));
}

/* =======================
   أدوات مساعدة
======================= */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(message, type = "success") {
  let oldToast = document.getElementById("toast-msg");
  if (oldToast) oldToast.remove();

  let toast = document.createElement("div");
  toast.id = "toast-msg";
  toast.textContent = message;

  toast.style.position = "fixed";
  toast.style.left = "20px";
  toast.style.bottom = "20px";
  toast.style.zIndex = "9999";
  toast.style.padding = "12px 18px";
  toast.style.borderRadius = "8px";
  toast.style.color = "#fff";
  toast.style.fontSize = "14px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
  toast.style.background = type === "error" ? "#c0392b" : "#1f7a63";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function tableExists(id) {
  return !!document.getElementById(id);
}

/* =======================
   القائمة الجانبية
======================= */
function toggleMenu() {
  let sidebar = document.getElementById("sidebar");
  let overlay = document.getElementById("overlay");
  sidebar.classList.toggle("open");
  overlay.style.display = sidebar.classList.contains("open") ? "block" : "none";
}

function closeMenu() {
  let sidebar = document.getElementById("sidebar");
  let overlay = document.getElementById("overlay");
  sidebar.classList.remove("open");
  overlay.style.display = "none";
}

/* =======================
   الصفحة الرئيسية
======================= */
function showHome() {
  closeMenu();

  let totalIncoming = incoming.length;
  let totalOutgoing = outgoing.length;
  let totalStock = stock.length;

  let totalValue = incoming.reduce((sum,i)=> sum + (i.total || 0),0);

  let lastOps = [
    ...incoming.slice(0,2).map(i=>`وارد: ${i.name} - ${i.qty} ${i.unit}`),
    ...outgoing.slice(0,2).map(i=>`خارج: ${i.name} - ${i.qty} ${i.unit}`)
  ];

  let lowStock = stock.filter(i => i.qty <= 5);

  document.getElementById("content").innerHTML = `

  <div class="card">
    <h2>نظام إدارة مطبخ الخير</h2>
    <p>
      لوحة تحكم بسيطة تساعدك على متابعة حركة المواد الغذائية
      داخل المطبخ من وارد وخارج ومخزون بطريقة منظمة وسهلة.
    </p>
  </div>

  <div class="stats-grid">

    <div class="stat-box">
      <span>📥</span>
      <h3>الوارد</h3>
      <p>${totalIncoming}</p>
    </div>

    <div class="stat-box">
      <span>📤</span>
      <h3>الخارج</h3>
      <p>${totalOutgoing}</p>
    </div>

    <div class="stat-box">
      <span>📦</span>
      <h3>المخزون</h3>
      <p>${totalStock}</p>
    </div>

    <div class="stat-box">
      <span>💰</span>
      <h3>إجمالي الوارد</h3>
      <p>${totalValue}</p>
    </div>

  </div>

  <div class="card">
    <h3>آخر العمليات</h3>
    <ul style="line-height:1.9">

      ${
        lastOps.length === 0
        ? "<li>لا توجد عمليات بعد</li>"
        : lastOps.map(i=>`<li>${i}</li>`).join("")
      }

    </ul>
  </div>

  <div class="card">
    <h3>تنبيه المخزون</h3>
    <ul style="line-height:1.9">

      ${
        lowStock.length === 0
        ? "<li>المخزون بحالة جيدة</li>"
        : lowStock.map(i=>`<li>${i.name} المتبقي: ${i.qty} ${i.unit}</li>`).join("")
      }

    </ul>
  </div>

  `;
}

/* =======================
   الوارد
======================= */
function showIncoming() {
  closeMenu();
  document.getElementById("content").innerHTML = `
    <div style="background:#fff;padding:18px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:15px;">
      <h2>الوارد</h2>
      <form id="incomingForm">
        <input id="date" type="date" value="${getToday()}">
        <input id="name" placeholder="الصنف">
        <input id="qty" type="number" min="0" step="any" placeholder="الكمية">

        <select id="unit" onchange="checkCustomUnit(this)">
          <option>كيلو</option>
          <option>لتر</option>
          <option>غرام</option>
          <option>حبة</option>
          <option>كرتونة</option>
          <option>غير ذلك</option>
        </select>

        <input type="text" id="customUnit" placeholder="اكتب الوحدة" style="display:none;margin-top:5px;">

        <select id="type">
          <option>تبرع</option>
          <option>شراء</option>
        </select>

        <input id="price" type="number" min="0" step="any" placeholder="سعر الوحدة">
        <input id="notes" placeholder="ملاحظات">

        <button type="button" onclick="saveIncoming()">حفظ</button>
        <button type="button" onclick="clearIncomingForm()">تفريغ</button>
      </form>
    </div>

    <div style="background:#fff;padding:18px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
        <h3 style="margin:0;">سجل الوارد</h3>
        <div style="min-width:220px;flex:1;max-width:320px;">
          <input id="incomingSearch" placeholder="ابحث بالاسم أو النوع أو الملاحظات" oninput="incomingPage = 1; renderIncoming()">
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table id="incomingTable"></table>
      </div>

      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px;">
        <label>عرض</label>
        <select id="incomingPerPage" onchange="changeIncomingPerPage(this.value)">
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
        </select>

        <button type="button" onclick="prevIncomingPage()">السابق</button>
        <button type="button" onclick="nextIncomingPage()">التالي</button>

        <span id="incomingPageInfo"></span>
      </div>

      <button onclick="exportIncoming()">تصدير الكل</button>
      <button onclick="exportSelectedIncoming()">تصدير المحدد</button>
    </div>
  `;

  renderIncoming();

  let perPageEl = document.getElementById("incomingPerPage");
  if (perPageEl) perPageEl.value = incomingPerPage;
}

function checkCustomUnit(select) {
  let input = document.getElementById("customUnit");
  if (!input) return;

  if (select.value === "غير ذلك") {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}

function clearIncomingForm() {
  let defaults = {
    date: getToday(),
    name: "",
    qty: "",
    unit: "كيلو",
    customUnit: "",
    type: "تبرع",
    price: "",
    notes: ""
  };

  Object.keys(defaults).forEach(id => {
    let el = document.getElementById(id);
    if (!el) return;
    el.value = defaults[id];
  });

  let customUnit = document.getElementById("customUnit");
  if (customUnit) customUnit.style.display = "none";

  editIncomingIndex = null;
}

function saveIncoming() {
  let date = document.getElementById("date")?.value;
  let name = document.getElementById("name")?.value.trim();
  let qty = Number(document.getElementById("qty")?.value);
  let unitSelect = document.getElementById("unit")?.value;
  let customUnit = document.getElementById("customUnit")?.value.trim();
  let type = document.getElementById("type")?.value;
  let price = Number(document.getElementById("price")?.value);
  let notes = document.getElementById("notes")?.value.trim();

  let unitValue = unitSelect === "غير ذلك" ? customUnit : unitSelect;

  if (!date || !name || !unitValue || qty <= 0 || price < 0) {
    showToast("الرجاء تعبئة بيانات الوارد بشكل صحيح", "error");
    return;
  }

  let item = {
    date: date,
    name: name,
    qty: qty,
    unit: unitValue,
    type: type,
    price: price,
    total: qty * price,
    notes: notes
  };

  if (editIncomingIndex !== null) {
    incoming[editIncomingIndex] = item;
    editIncomingIndex = null;
  } else {
    incoming.unshift(item);
  }

  recalcStock();
  saveLocal();
  clearIncomingForm();

  if (incomingPage > Math.max(1, Math.ceil(incoming.length / incomingPerPage))) {
    incomingPage = 1;
  }

  renderIncoming();
  renderStock();
  showToast("تم حفظ السجل بنجاح");
}

function renderIncoming() {
  let tableEl = document.getElementById("incomingTable");
  if (!tableEl) return;

  let search = (document.getElementById("incomingSearch")?.value || "").trim().toLowerCase();

  let filtered = incoming.filter(i => {
    if (!search) return true;
    return (
      (i.name || "").toLowerCase().includes(search) ||
      (i.type || "").toLowerCase().includes(search) ||
      (i.notes || "").toLowerCase().includes(search) ||
      (i.unit || "").toLowerCase().includes(search) ||
      (i.date || "").toLowerCase().includes(search)
    );
  });

  let totalPages = Math.max(1, Math.ceil(filtered.length / incomingPerPage));
  if (incomingPage > totalPages) incomingPage = totalPages;

  let start = (incomingPage - 1) * incomingPerPage;
  let end = start + incomingPerPage;
  let paginated = filtered.slice(start, end);

  let table = `
    <tr style="background:#1f7a63;color:white;font-family:Arial;font-size:14px">
      <th>
        <input
          type="checkbox"
          id="selectAllIncoming"
          ${filtered.length > 0 && filtered.every(i => selectedIncoming.has(incoming.indexOf(i))) ? "checked" : ""}
          onchange="toggleSelectAllIncoming(this)"
        >
      </th>
      <th>#</th>
      <th>التاريخ</th>
      <th>الصنف</th>
      <th>الكمية</th>
      <th>الوحدة</th>
      <th>النوع</th>
      <th>السعر</th>
      <th>الإجمالي</th>
      <th>ملاحظات</th>
      <th>تحكم</th>
    </tr>
  `;

  if (filtered.length === 0) {
    table += `<tr><td colspan="11">لا توجد نتائج</td></tr>`;
  } else {
    paginated.forEach((i, index) => {
      let realIndex = incoming.indexOf(i);

      table += `
        <tr>
          <td>
            <input
              type="checkbox"
              ${selectedIncoming.has(realIndex) ? "checked" : ""}
              onchange="toggleIncomingSelection(${realIndex}, this)"
            >
          </td>
          <td style="color:#d35400">${start + index + 1}</td>
          <td>${escapeHtml(i.date)}</td>
          <td>${escapeHtml(i.name)}</td>
          <td style="color:#2980b9">${formatNumber(i.qty)}</td>
          <td>${escapeHtml(i.unit)}</td>
          <td>${escapeHtml(i.type)}</td>
          <td>${formatNumber(i.price)}</td>
          <td style="color:#27ae60">${formatNumber(i.total || (i.qty * i.price))}</td>
          <td>${escapeHtml(i.notes || "")}</td>
          <td class="actions">
            <button onclick="editIncoming(${realIndex})">تعديل</button>
            <button onclick="deleteIncoming(${realIndex})">حذف</button>
          </td>
        </tr>
      `;
    });
  }

  let pageInfo = document.getElementById("incomingPageInfo");
  if (pageInfo) {
    pageInfo.textContent = `الصفحة ${incomingPage} من ${totalPages}`;
  }

  tableEl.innerHTML = table;
}

function editIncoming(i) {
  let item = incoming[i];
  if (!item) return;

  document.getElementById("date").value = item.date || "";
  document.getElementById("name").value = item.name || "";
  document.getElementById("qty").value = item.qty || "";

  if (["كيلو", "لتر", "غرام", "حبة", "كرتونة"].includes(item.unit)) {
    document.getElementById("unit").value = item.unit;
    document.getElementById("customUnit").style.display = "none";
    document.getElementById("customUnit").value = "";
  } else {
    document.getElementById("unit").value = "غير ذلك";
    document.getElementById("customUnit").style.display = "block";
    document.getElementById("customUnit").value = item.unit || "";
  }

  document.getElementById("type").value = item.type || "تبرع";
  document.getElementById("price").value = item.price || 0;
  document.getElementById("notes").value = item.notes || "";

  editIncomingIndex = i;
}

function deleteIncoming(i) {
  if (!confirm("هل تريد حذف هذا السجل؟")) return;

  incoming.splice(i, 1);
  selectedIncoming.clear();

  recalcStock();
  saveLocal();

  let search = (document.getElementById("incomingSearch")?.value || "").trim().toLowerCase();
  let filtered = incoming.filter(item => {
    if (!search) return true;
    return (
      (item.name || "").toLowerCase().includes(search) ||
      (item.type || "").toLowerCase().includes(search) ||
      (item.notes || "").toLowerCase().includes(search) ||
      (item.unit || "").toLowerCase().includes(search) ||
      (item.date || "").toLowerCase().includes(search)
    );
  });

  let totalPages = Math.max(1, Math.ceil(filtered.length / incomingPerPage));
  if (incomingPage > totalPages) incomingPage = totalPages;

  renderIncoming();
  showToast("تم حذف السجل");
}

function toggleIncomingSelection(index, checkbox) {
  if (checkbox.checked) {
    selectedIncoming.add(index);
  } else {
    selectedIncoming.delete(index);
  }
}

function toggleSelectAllIncoming(source) {
  let search = (document.getElementById("incomingSearch")?.value || "").trim().toLowerCase();

  let filtered = incoming.filter(i => {
    if (!search) return true;
    return (
      (i.name || "").toLowerCase().includes(search) ||
      (i.type || "").toLowerCase().includes(search) ||
      (i.notes || "").toLowerCase().includes(search) ||
      (i.unit || "").toLowerCase().includes(search) ||
      (i.date || "").toLowerCase().includes(search)
    );
  });

  selectedIncoming.clear();

  if (source.checked) {
    filtered.forEach(i => {
      selectedIncoming.add(incoming.indexOf(i));
    });
  }

  renderIncoming();
}

function exportSelectedIncoming() {
  if (selectedIncoming.size === 0) {
    showToast("حدد عناصر أولاً", "error");
    return;
  }

  let rows = [];

  selectedIncoming.forEach((index, order) => {
    let i = incoming[index];
    if (!i) return;

    rows.push({
      "#": order + 1,
      "التاريخ": i.date || "",
      "الصنف": i.name || "",
      "الكمية": i.qty || 0,
      "الوحدة": i.unit || "",
      "النوع": i.type || "",
      "سعر الوحدة": i.price || 0,
      "الإجمالي": i.total || (Number(i.qty || 0) * Number(i.price || 0)),
      "ملاحظات": i.notes || ""
    });
  });

  exportStyledExcel(rows, "الوارد المحدد", "الوارد_المحدد.xlsx");
}

function changeIncomingPerPage(value) {
  incomingPerPage = Number(value);
  incomingPage = 1;
  renderIncoming();
}

function prevIncomingPage() {
  if (incomingPage > 1) {
    incomingPage--;
    renderIncoming();
  }
}

function nextIncomingPage() {
  let search = (document.getElementById("incomingSearch")?.value || "").trim().toLowerCase();

  let filtered = incoming.filter(i => {
    if (!search) return true;
    return (
      (i.name || "").toLowerCase().includes(search) ||
      (i.type || "").toLowerCase().includes(search) ||
      (i.notes || "").toLowerCase().includes(search) ||
      (i.unit || "").toLowerCase().includes(search) ||
      (i.date || "").toLowerCase().includes(search)
    );
  });

  let totalPages = Math.max(1, Math.ceil(filtered.length / incomingPerPage));

  if (incomingPage < totalPages) {
    incomingPage++;
    renderIncoming();
  }
}

/* =======================
   الخارج
======================= */
function showOutgoing() {
  closeMenu();

  let options = stock
    .filter(i => i.qty > 0)
    .map(i => {
      let value = `${i.name}|||${i.unit}`;
      return `<option value="${escapeHtml(value)}">${escapeHtml(i.name)} - ${escapeHtml(i.unit)} (المتوفر: ${formatNumber(i.qty)})</option>`;
    })
    .join("");

  document.getElementById("content").innerHTML = `
    <div style="background:#fff;padding:18px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:15px;">
      <h2>الخارج</h2>
      <input id="date" type="date" value="${getToday()}">
      <select id="outName">${options || '<option value="">لا يوجد أصناف متاحة</option>'}</select>
      <input id="outQty" type="number" min="0" step="any" placeholder="الكمية">
      <input id="outNotes" placeholder="ملاحظات">
      <button onclick="saveOutgoing()">حفظ</button>
      <button type="button" onclick="clearOutgoingForm()">تفريغ</button>
    </div>

    <div style="background:#fff;padding:18px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <h3 style="margin-top:0;">سجل الخارج</h3>

      <div style="overflow-x:auto;">
        <table id="outgoingTable"></table>
      </div>

      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px;">
        <label>عرض</label>
        <select id="outgoingPerPage" onchange="changeOutgoingPerPage(this.value)">
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
        </select>

        <button type="button" onclick="prevOutgoingPage()">السابق</button>
        <button type="button" onclick="nextOutgoingPage()">التالي</button>

        <span id="outgoingPageInfo"></span>
      </div>

      <button onclick="exportOutgoing()">تصدير الكل</button>
      <button onclick="exportSelectedOutgoing()">تصدير المحدد</button>
    </div>
  `;

  renderOutgoing();

  let perPageEl = document.getElementById("outgoingPerPage");
  if (perPageEl) perPageEl.value = outgoingPerPage;
}

function clearOutgoingForm() {
  let dateEl = document.getElementById("date");
  let qtyEl = document.getElementById("outQty");
  let notesEl = document.getElementById("outNotes");

  if (dateEl) dateEl.value = getToday();
  if (qtyEl) qtyEl.value = "";
  if (notesEl) notesEl.value = "";

  editOutgoingIndex = null;
}

function saveOutgoing() {
  let date = document.getElementById("date")?.value;
  let selected = document.getElementById("outName")?.value || "";
  let qty = Number(document.getElementById("outQty")?.value);
  let notes = document.getElementById("outNotes")?.value.trim();

  if (!date || !selected || qty <= 0) {
    showToast("الرجاء تعبئة بيانات الخارج بشكل صحيح", "error");
    return;
  }

  let [name, unit] = selected.split("|||");
  let exist = stock.find(i => i.name === name && i.unit === unit);

  if (!exist) {
    showToast("الصنف غير موجود في المخزون", "error");
    return;
  }

  if (qty > exist.qty) {
    showToast("الكمية المطلوبة أكبر من الموجود في المخزون", "error");
    return;
  }

  let item = {
    date,
    name,
    qty,
    unit,
    notes
  };

  if (editOutgoingIndex !== null) {
    outgoing[editOutgoingIndex] = item;
    editOutgoingIndex = null;
    showToast("تم تعديل سجل الخارج");
  } else {
    outgoing.unshift(item);
    showToast("تم حفظ الخارج بنجاح");
  }

  recalcStock();
  saveLocal();
  showOutgoing();
}

function renderOutgoing() {
  let tableEl = document.getElementById("outgoingTable");
  if (!tableEl) return;

  let start = (outgoingPage - 1) * outgoingPerPage;
  let end = start + outgoingPerPage;
  let paginated = outgoing.slice(start, end);
  let totalPages = Math.max(1, Math.ceil(outgoing.length / outgoingPerPage));

  let table = `
    <tr style="background:#1f7a63;color:white;font-family:Arial;font-size:14px">
      <th>
        <input
          type="checkbox"
          id="selectAllOutgoing"
          ${outgoing.length > 0 && outgoing.every((_, index) => selectedOutgoing.has(index)) ? "checked" : ""}
          onchange="toggleSelectAllOutgoing(this)"
        >
      </th>
      <th>#</th>
      <th>التاريخ</th>
      <th>الصنف</th>
      <th>الكمية</th>
      <th>الوحدة</th>
      <th>ملاحظات</th>
      <th>تحكم</th>
    </tr>
  `;

  if (outgoing.length === 0) {
    table += `<tr><td colspan="8">لا توجد بيانات</td></tr>`;
  } else {
    paginated.forEach((i, index) => {
      let realIndex = start + index;

      table += `
        <tr>
          <td>
            <input
              type="checkbox"
              ${selectedOutgoing.has(realIndex) ? "checked" : ""}
              onchange="toggleOutgoingSelection(${realIndex}, this)"
            >
          </td>
          <td style="color:#d35400">${realIndex + 1}</td>
          <td>${escapeHtml(i.date)}</td>
          <td>${escapeHtml(i.name)}</td>
          <td style="color:#2980b9">${formatNumber(i.qty)}</td>
          <td>${escapeHtml(i.unit)}</td>
          <td>${escapeHtml(i.notes || "")}</td>
          <td style="min-width:130px">
            <div style="display:flex;flex-direction:column;gap:6px">
              <button onclick="editOutgoing(${realIndex})">تعديل</button>
              <button onclick="deleteOutgoing(${realIndex})">حذف</button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  let pageInfo = document.getElementById("outgoingPageInfo");
  if (pageInfo) {
    pageInfo.textContent = `الصفحة ${outgoingPage} من ${totalPages}`;
  }

  tableEl.innerHTML = table;
}

function editOutgoing(i) {
  let item = outgoing[i];
  if (!item) return;

  showOutgoing();

  setTimeout(() => {
    document.getElementById("date").value = item.date || "";
    document.getElementById("outQty").value = item.qty || "";
    document.getElementById("outNotes").value = item.notes || "";

    let select = document.getElementById("outName");
    let targetValue = `${item.name}|||${item.unit}`;
    if ([...select.options].some(opt => opt.value === targetValue)) {
      select.value = targetValue;
    }

    editOutgoingIndex = i;
  }, 0);
}

function deleteOutgoing(i) {
  if (!confirm("هل تريد حذف هذا السجل؟")) return;

  outgoing.splice(i, 1);
  selectedOutgoing.clear();

  let totalPages = Math.max(1, Math.ceil(outgoing.length / outgoingPerPage));
  if (outgoingPage > totalPages) outgoingPage = totalPages;

  recalcStock();
  saveLocal();
  renderOutgoing();
  showToast("تم حذف سجل الخارج");
}

function toggleOutgoingSelection(index, checkbox) {
  if (checkbox.checked) {
    selectedOutgoing.add(index);
  } else {
    selectedOutgoing.delete(index);
  }
}

function toggleSelectAllOutgoing(source) {
  selectedOutgoing.clear();

  if (source.checked) {
    outgoing.forEach((_, index) => {
      selectedOutgoing.add(index);
    });
  }

  renderOutgoing();
}

function exportSelectedOutgoing() {
  if (selectedOutgoing.size === 0) {
    showToast("حدد عناصر أولاً", "error");
    return;
  }

  let rows = [];

  selectedOutgoing.forEach((index, order) => {
    let i = outgoing[index];

    rows.push({
      "#": order + 1,
      "التاريخ": i.date || "",
      "الصنف": i.name || "",
      "الكمية": i.qty || 0,
      "الوحدة": i.unit || "",
      "ملاحظات": i.notes || ""
    });
  });

  exportStyledExcel(rows, "الخارج المحدد", "الخارج_المحدد.xlsx");
}

function changeOutgoingPerPage(value) {
  outgoingPerPage = Number(value);
  outgoingPage = 1;
  renderOutgoing();
}

function prevOutgoingPage() {
  if (outgoingPage > 1) {
    outgoingPage--;
    renderOutgoing();
  }
}

function nextOutgoingPage() {
  let totalPages = Math.max(1, Math.ceil(outgoing.length / outgoingPerPage));

  if (outgoingPage < totalPages) {
    outgoingPage++;
    renderOutgoing();
  }
}

/* =======================
   المخزون
======================= */
function showStock() {
  closeMenu();
  document.getElementById("content").innerHTML = `
    <div style="background:#fff;padding:18px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <h2>المخزون الحالي</h2>

      <div style="overflow-x:auto;">
        <table id="stockTable"></table>
      </div>

      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px;">
        <label>عرض</label>
        <select id="stockPerPage" onchange="changeStockPerPage(this.value)">
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
        </select>

        <button type="button" onclick="prevStockPage()">السابق</button>
        <button type="button" onclick="nextStockPage()">التالي</button>

        <span id="stockPageInfo"></span>
      </div>

      <button onclick="exportStock()">تصدير الكل</button>
      <button onclick="exportSelectedStock()">تصدير المحدد</button>
    </div>
  `;

  renderStock();

  let perPageEl = document.getElementById("stockPerPage");
  if (perPageEl) perPageEl.value = stockPerPage;
}

function renderStock() {
  let tableEl = document.getElementById("stockTable");
  if (!tableEl) return;

  let start = (stockPage - 1) * stockPerPage;
  let end = start + stockPerPage;
  let paginated = stock.slice(start, end);
  let totalPages = Math.max(1, Math.ceil(stock.length / stockPerPage));

  let table = `
    <tr style="background:#1f7a63;color:white;font-family:Arial;font-size:14px">
      <th>
        <input
          type="checkbox"
          id="selectAllStock"
          ${stock.length > 0 && stock.every((_, index) => selectedStock.has(index)) ? "checked" : ""}
          onchange="toggleSelectAllStock(this)"
        >
      </th>
      <th>#</th>
      <th>الصنف</th>
      <th>الكمية</th>
      <th>الوحدة</th>
      <th>ملاحظات</th>
    </tr>
  `;

  if (stock.length === 0) {
    table += `<tr><td colspan="6">لا يوجد مخزون</td></tr>`;
  } else {
    paginated.forEach((i, index) => {
      let realIndex = start + index;

      table += `
        <tr>
          <td>
            <input
              type="checkbox"
              ${selectedStock.has(realIndex) ? "checked" : ""}
              onchange="toggleStockSelection(${realIndex}, this)"
            >
          </td>
          <td style="color:#d35400">${realIndex + 1}</td>
          <td>${escapeHtml(i.name)}</td>
          <td style="color:#2980b9">${formatNumber(i.qty)}</td>
          <td>${escapeHtml(i.unit)}</td>
          <td>${escapeHtml(i.notes || "")}</td>
        </tr>
      `;
    });
  }

  let pageInfo = document.getElementById("stockPageInfo");
  if (pageInfo) {
    pageInfo.textContent = `الصفحة ${stockPage} من ${totalPages}`;
  }

  tableEl.innerHTML = table;
}

function toggleStockSelection(index, checkbox) {
  if (checkbox.checked) {
    selectedStock.add(index);
  } else {
    selectedStock.delete(index);
  }
}

function toggleSelectAllStock(source) {
  selectedStock.clear();

  if (source.checked) {
    stock.forEach((_, index) => {
      selectedStock.add(index);
    });
  }

  renderStock();
}

function exportSelectedStock() {
  if (selectedStock.size === 0) {
    showToast("حدد عناصر أولاً", "error");
    return;
  }

  let rows = [];

  selectedStock.forEach((index, order) => {
    let i = stock[index];

    rows.push({
      "#": order + 1,
      "الصنف": i.name || "",
      "الكمية": i.qty || 0,
      "الوحدة": i.unit || "",
      "ملاحظات": i.notes || ""
    });
  });

  exportStyledExcel(rows, "المخزون المحدد", "المخزون_المحدد.xlsx");
}

function changeStockPerPage(value) {
  stockPerPage = Number(value);
  stockPage = 1;
  renderStock();
}

function prevStockPage() {
  if (stockPage > 1) {
    stockPage--;
    renderStock();
  }
}

function nextStockPage() {
  let totalPages = Math.max(1, Math.ceil(stock.length / stockPerPage));

  if (stockPage < totalPages) {
    stockPage++;
    renderStock();
  }
}

/* =======================
   الإحصائيات
======================= */
function showStats() {
  closeMenu();
  document.getElementById("content").innerHTML = `
    <div style="background:#fff;padding:18px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <h2>الإحصائيات والتقارير الذكية</h2>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <label style="flex:1;min-width:200px;">من تاريخ:
          <input type="date" id="fromDate">
        </label>
        <label style="flex:1;min-width:200px;">إلى تاريخ:
          <input type="date" id="toDate">
        </label>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button onclick="renderStats()">عرض التقرير</button>
        <button onclick="clearStatsFilter()">إلغاء التصفية</button>
        <button onclick="exportStats()">تصدير Excel</button>
      </div>

      <div id="statsContent" style="margin-top:20px;"></div>
    </div>
  `;
  renderStats();
}

function clearStatsFilter() {
  let fromEl = document.getElementById("fromDate");
  let toEl = document.getElementById("toDate");

  if (fromEl) fromEl.value = "";
  if (toEl) toEl.value = "";

  renderStats();
}

function getStatsData() {
  let from = document.getElementById("fromDate")?.value || null;
  let to = document.getElementById("toDate")?.value || null;

  let filteredIncoming = incoming.filter(i => {
    if (from && i.date < from) return false;
    if (to && i.date > to) return false;
    return true;
  });

  let filteredOutgoing = outgoing.filter(i => {
    if (from && i.date < from) return false;
    if (to && i.date > to) return false;
    return true;
  });

  let totalIncomingQty = 0;
  let totalIncomingValue = 0;
  let totalOutgoingQty = 0;
  let totalDonationValue = 0;
  let totalPurchaseValue = 0;
  let totalDonationQty = 0;
  let totalPurchaseQty = 0;

  let incomingSummary = {};
  let outgoingSummary = {};

  filteredIncoming.forEach(i => {
    let qty = Number(i.qty || 0);
    let price = Number(i.price || 0);
    let total = Number(i.total || (qty * price));

    totalIncomingQty += qty;
    totalIncomingValue += total;

    if (i.type === "تبرع") {
      totalDonationValue += total;
      totalDonationQty += qty;
    } else if (i.type === "شراء") {
      totalPurchaseValue += total;
      totalPurchaseQty += qty;
    }

    let key = `${i.name}|||${i.unit}`;
    if (!incomingSummary[key]) {
      incomingSummary[key] = {
        name: i.name || "",
        unit: i.unit || "",
        qty: 0,
        total: 0,
        count: 0
      };
    }

    incomingSummary[key].qty += qty;
    incomingSummary[key].total += total;
    incomingSummary[key].count += 1;
  });

  filteredOutgoing.forEach(i => {
    let qty = Number(i.qty || 0);
    totalOutgoingQty += qty;

    let key = `${i.name}|||${i.unit}`;
    if (!outgoingSummary[key]) {
      outgoingSummary[key] = {
        name: i.name || "",
        unit: i.unit || "",
        qty: 0,
        count: 0
      };
    }

    outgoingSummary[key].qty += qty;
    outgoingSummary[key].count += 1;
  });

  let incomingList = Object.values(incomingSummary).sort((a, b) => b.qty - a.qty);
  let outgoingList = Object.values(outgoingSummary).sort((a, b) => b.qty - a.qty);

  let topIncomingQty = incomingList[0] || null;
  let topIncomingValue = [...incomingList].sort((a, b) => b.total - a.total)[0] || null;
  let topOutgoingQty = outgoingList[0] || null;

  let lowStock = stock
    .filter(i => Number(i.qty || 0) > 0 && Number(i.qty || 0) <= 5)
    .sort((a, b) => Number(a.qty || 0) - Number(b.qty || 0));

  let zeroStock = stock
    .filter(i => Number(i.qty || 0) <= 0)
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));

  let stockRich = [...stock]
    .filter(i => Number(i.qty || 0) > 0)
    .sort((a, b) => Number(b.qty || 0) - Number(a.qty || 0));

  let highestStock = stockRich[0] || null;

  let totalIncomingRecords = filteredIncoming.length;
  let totalOutgoingRecords = filteredOutgoing.length;
  let distinctIncomingItems = incomingList.length;
  let distinctOutgoingItems = outgoingList.length;

  let avgIncomingValue = totalIncomingRecords ? (totalIncomingValue / totalIncomingRecords) : 0;
  let avgPurchaseValue = totalPurchaseQty ? (totalPurchaseValue / totalPurchaseQty) : 0;

  return {
    from,
    to,
    filteredIncoming,
    filteredOutgoing,
    totalIncomingQty,
    totalIncomingValue,
    totalOutgoingQty,
    totalDonationValue,
    totalPurchaseValue,
    totalDonationQty,
    totalPurchaseQty,
    totalIncomingRecords,
    totalOutgoingRecords,
    distinctIncomingItems,
    distinctOutgoingItems,
    avgIncomingValue,
    avgPurchaseValue,
    incomingList,
    outgoingList,
    topIncomingQty,
    topIncomingValue,
    topOutgoingQty,
    lowStock,
    zeroStock,
    highestStock
  };
}

function renderStats() {
  let container = document.getElementById("statsContent");
  if (!container) return;

  let stats = getStatsData();

  let incomingRows = stats.incomingList.map(i => `
    <tr>
      <td>${escapeHtml(i.name)}</td>
      <td>${formatNumber(i.qty)}</td>
      <td>${escapeHtml(i.unit)}</td>
      <td>${formatNumber(i.total)}</td>
      <td>${formatNumber(i.count)}</td>
    </tr>
  `).join("");

  let outgoingRows = stats.outgoingList.map(i => `
    <tr>
      <td>${escapeHtml(i.name)}</td>
      <td>${formatNumber(i.qty)}</td>
      <td>${escapeHtml(i.unit)}</td>
      <td>${formatNumber(i.count)}</td>
    </tr>
  `).join("");

  let lowStockRows = stats.lowStock.map(i => `
    <tr>
      <td>${escapeHtml(i.name)}</td>
      <td>${formatNumber(i.qty)}</td>
      <td>${escapeHtml(i.unit)}</td>
      <td>${escapeHtml(i.notes || "")}</td>
    </tr>
  `).join("");

  let zeroStockRows = stats.zeroStock.map(i => `
    <tr>
      <td>${escapeHtml(i.name)}</td>
      <td>${formatNumber(i.qty)}</td>
      <td>${escapeHtml(i.unit)}</td>
      <td>${escapeHtml(i.notes || "")}</td>
    </tr>
  `).join("");

  let periodText = "كل الفترات";
  if (stats.from && stats.to) periodText = `من ${stats.from} إلى ${stats.to}`;
  else if (stats.from) periodText = `من ${stats.from}`;
  else if (stats.to) periodText = `حتى ${stats.to}`;

  container.innerHTML = `
    <div style="margin-bottom:16px;padding:14px;border-radius:10px;background:#f8fafc;border:1px solid #e5e7eb;">
      <strong>الفترة المحددة:</strong> ${escapeHtml(periodText)}
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-bottom:20px;">
      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>إجمالي قيمة الوارد</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.totalIncomingValue)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>إجمالي كمية الوارد</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.totalIncomingQty)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>إجمالي كمية الخارج</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.totalOutgoingQty)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>إجمالي التبرعات</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.totalDonationValue)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>إجمالي المشتريات</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.totalPurchaseValue)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>عدد سجلات الوارد</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.totalIncomingRecords)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>عدد سجلات الخارج</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.totalOutgoingRecords)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>عدد أصناف الوارد</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.distinctIncomingItems)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>عدد أصناف الخارج</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.distinctOutgoingItems)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>متوسط قيمة السجل الوارد</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.avgIncomingValue)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>متوسط سعر المشتريات</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.avgPurchaseValue)}</strong>
      </div>

      <div style="background:#f8fafc;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <div>المخزون المنخفض</div>
        <strong style="font-size:22px;color:#1f7a63;">${formatNumber(stats.lowStock.length)}</strong>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:20px;">
      <div style="background:#fff;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <h3 style="margin-top:0;">أهم المؤشرات</h3>
        <p><strong>أعلى صنف وارد بالكمية:</strong> ${stats.topIncomingQty ? `${escapeHtml(stats.topIncomingQty.name)} (${formatNumber(stats.topIncomingQty.qty)} ${escapeHtml(stats.topIncomingQty.unit)})` : "لا يوجد"}</p>
        <p><strong>أعلى صنف وارد بالقيمة:</strong> ${stats.topIncomingValue ? `${escapeHtml(stats.topIncomingValue.name)} (${formatNumber(stats.topIncomingValue.total)})` : "لا يوجد"}</p>
        <p><strong>أعلى صنف خارج:</strong> ${stats.topOutgoingQty ? `${escapeHtml(stats.topOutgoingQty.name)} (${formatNumber(stats.topOutgoingQty.qty)} ${escapeHtml(stats.topOutgoingQty.unit)})` : "لا يوجد"}</p>
        <p><strong>أعلى مخزون حالي:</strong> ${stats.highestStock ? `${escapeHtml(stats.highestStock.name)} (${formatNumber(stats.highestStock.qty)} ${escapeHtml(stats.highestStock.unit)})` : "لا يوجد"}</p>
      </div>

      <div style="background:#fff;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
        <h3 style="margin-top:0;">ملخص مالي</h3>
        <p><strong>قيمة التبرعات:</strong> ${formatNumber(stats.totalDonationValue)}</p>
        <p><strong>كمية التبرعات:</strong> ${formatNumber(stats.totalDonationQty)}</p>
        <p><strong>قيمة المشتريات:</strong> ${formatNumber(stats.totalPurchaseValue)}</p>
        <p><strong>كمية المشتريات:</strong> ${formatNumber(stats.totalPurchaseQty)}</p>
        <p><strong>إجمالي الحركة المالية:</strong> ${formatNumber(stats.totalIncomingValue)}</p>
      </div>
    </div>

    <div style="background:#fff;border:1px solid #e5e7eb;padding:15px;border-radius:10px;margin-bottom:16px;">
      <h3>ملخص الوارد حسب الصنف</h3>
      <div style="overflow-x:auto;">
        <table>
          <tr style="background:#1f7a63;color:white">
            <th>الصنف</th>
            <th>الكمية</th>
            <th>الوحدة</th>
            <th>القيمة الإجمالية</th>
            <th>عدد مرات التكرار</th>
          </tr>
          ${incomingRows || `<tr><td colspan="5">لا توجد بيانات</td></tr>`}
        </table>
      </div>
    </div>

    <div style="background:#fff;border:1px solid #e5e7eb;padding:15px;border-radius:10px;margin-bottom:16px;">
      <h3>ملخص الخارج حسب الصنف</h3>
      <div style="overflow-x:auto;">
        <table>
          <tr style="background:#1f7a63;color:white">
            <th>الصنف</th>
            <th>الكمية</th>
            <th>الوحدة</th>
            <th>عدد مرات الصرف</th>
          </tr>
          ${outgoingRows || `<tr><td colspan="4">لا توجد بيانات</td></tr>`}
        </table>
      </div>
    </div>

    <div style="background:#fff;border:1px solid #e5e7eb;padding:15px;border-radius:10px;margin-bottom:16px;">
      <h3>تنبيه المخزون المنخفض</h3>
      <div style="overflow-x:auto;">
        <table>
          <tr style="background:#1f7a63;color:white">
            <th>الصنف</th>
            <th>الكمية</th>
            <th>الوحدة</th>
            <th>ملاحظات</th>
          </tr>
          ${lowStockRows || `<tr><td colspan="4">لا يوجد مخزون منخفض حاليًا</td></tr>`}
        </table>
      </div>
    </div>

    <div style="background:#fff;border:1px solid #e5e7eb;padding:15px;border-radius:10px;">
      <h3>المخزون النافد أو الصفري</h3>
      <div style="overflow-x:auto;">
        <table>
          <tr style="background:#1f7a63;color:white">
            <th>الصنف</th>
            <th>الكمية</th>
            <th>الوحدة</th>
            <th>ملاحظات</th>
          </tr>
          ${zeroStockRows || `<tr><td colspan="4">لا يوجد مخزون نافد</td></tr>`}
        </table>
      </div>
    </div>
  `;
}

function exportStats() {
  let stats = getStatsData();

  if (
    stats.filteredIncoming.length === 0 &&
    stats.filteredOutgoing.length === 0 &&
    stock.length === 0
  ) {
    showToast("لا توجد بيانات للتصدير", "error");
    return;
  }

  let summaryRows = [
    { "البند": "إجمالي قيمة الوارد", "القيمة": stats.totalIncomingValue },
    { "البند": "إجمالي كمية الوارد", "القيمة": stats.totalIncomingQty },
    { "البند": "إجمالي كمية الخارج", "القيمة": stats.totalOutgoingQty },
    { "البند": "إجمالي قيمة التبرعات", "القيمة": stats.totalDonationValue },
    { "البند": "إجمالي قيمة المشتريات", "القيمة": stats.totalPurchaseValue },
    { "البند": "كمية التبرعات", "القيمة": stats.totalDonationQty },
    { "البند": "كمية المشتريات", "القيمة": stats.totalPurchaseQty },
    { "البند": "عدد سجلات الوارد", "القيمة": stats.totalIncomingRecords },
    { "البند": "عدد سجلات الخارج", "القيمة": stats.totalOutgoingRecords },
    { "البند": "عدد أصناف الوارد", "القيمة": stats.distinctIncomingItems },
    { "البند": "عدد أصناف الخارج", "القيمة": stats.distinctOutgoingItems },
    { "البند": "متوسط قيمة السجل الوارد", "القيمة": stats.avgIncomingValue },
    { "البند": "متوسط سعر المشتريات", "القيمة": stats.avgPurchaseValue },
    { "البند": "عدد المخزون المنخفض", "القيمة": stats.lowStock.length }
  ];

  let incomingRows = stats.filteredIncoming.map((i, idx) => ({
    "#": idx + 1,
    "التاريخ": i.date || "",
    "الصنف": i.name || "",
    "الكمية": i.qty || 0,
    "الوحدة": i.unit || "",
    "النوع": i.type || "",
    "سعر الوحدة": i.price || 0,
    "الإجمالي": i.total || (Number(i.qty || 0) * Number(i.price || 0)),
    "ملاحظات": i.notes || ""
  }));

  let outgoingRows = stats.filteredOutgoing.map((i, idx) => ({
    "#": idx + 1,
    "التاريخ": i.date || "",
    "الصنف": i.name || "",
    "الكمية": i.qty || 0,
    "الوحدة": i.unit || "",
    "ملاحظات": i.notes || ""
  }));

  let stockRows = stock.map((i, idx) => ({
    "#": idx + 1,
    "الصنف": i.name || "",
    "الكمية الحالية": i.qty || 0,
    "الوحدة": i.unit || "",
    "ملاحظات": i.notes || ""
  }));

  let lowStockRows = stats.lowStock.map((i, idx) => ({
    "#": idx + 1,
    "الصنف": i.name || "",
    "الكمية": i.qty || 0,
    "الوحدة": i.unit || "",
    "ملاحظات": i.notes || ""
  }));

  let incomingSummaryRows = stats.incomingList.map((i, idx) => ({
    "#": idx + 1,
    "الصنف": i.name || "",
    "الكمية": i.qty || 0,
    "الوحدة": i.unit || "",
    "القيمة الإجمالية": i.total || 0,
    "عدد مرات التكرار": i.count || 0
  }));

  let outgoingSummaryRows = stats.outgoingList.map((i, idx) => ({
    "#": idx + 1,
    "الصنف": i.name || "",
    "الكمية": i.qty || 0,
    "الوحدة": i.unit || "",
    "عدد مرات الصرف": i.count || 0
  }));

  let wb = XLSX.utils.book_new();

  let wsSummary = createStyledWorksheet(summaryRows);
  let wsIncoming = createStyledWorksheet(incomingRows);
  let wsOutgoing = createStyledWorksheet(outgoingRows);
  let wsStock = createStyledWorksheet(stockRows);
  let wsLowStock = createStyledWorksheet(lowStockRows);
  let wsIncomingSummary = createStyledWorksheet(incomingSummaryRows);
  let wsOutgoingSummary = createStyledWorksheet(outgoingSummaryRows);

  XLSX.utils.book_append_sheet(wb, wsSummary, "الملخص العام");
  XLSX.utils.book_append_sheet(wb, wsIncoming, "الوارد");
  XLSX.utils.book_append_sheet(wb, wsOutgoing, "الخارج");
  XLSX.utils.book_append_sheet(wb, wsStock, "المخزون");
  XLSX.utils.book_append_sheet(wb, wsLowStock, "المخزون المنخفض");
  XLSX.utils.book_append_sheet(wb, wsIncomingSummary, "ملخص الوارد");
  XLSX.utils.book_append_sheet(wb, wsOutgoingSummary, "ملخص الخارج");

  XLSX.writeFile(wb, "الإحصائيات_الشاملة.xlsx");
  showToast("تم تصدير الإحصائيات الشاملة بنجاح");
}

/* =======================
   النسخ الاحتياطي
======================= */
function showBackup() {
  closeMenu();
  document.getElementById("content").innerHTML = `
    <div style="background:#fff;padding:18px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <h2>النسخ الاحتياطي والاستيراد</h2>
      <p style="margin-top:0;color:#555;line-height:1.8;">
        يمكنك تصدير نسخة احتياطية كاملة من جميع البيانات، ثم استيرادها لاحقًا لاسترجاع كل شيء.
      </p>

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <button onclick="exportBackup()">تصدير نسخة احتياطية كاملة</button>
      </div>

      <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <input type="file" id="importFile" accept=".json">
        <button onclick="importBackup()">استيراد النسخة الاحتياطية</button>
      </div>

      <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">

      <button onclick="clearAllData()" style="background:#c0392b;">
        حذف جميع البيانات
      </button>
    </div>
  `;
}

function exportBackup() {
  let data = {
    appName: "مطبخ الخير",
    version: "1.0",
    exportedAt: new Date().toISOString(),

    incoming: Array.isArray(incoming) ? incoming : [],
    outgoing: Array.isArray(outgoing) ? outgoing : [],
    stock: Array.isArray(stock) ? stock : []
  };

  let blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json;charset=utf-8" }
  );

  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = `backup_mtbkh_${getToday()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("تم تصدير النسخة الاحتياطية الكاملة بنجاح");
}

function importBackup() {
  if (!confirm("سيتم استبدال جميع البيانات الحالية بالنسخة الاحتياطية. هل تريد المتابعة؟")) {
    return;
  }

  let fileInput = document.getElementById("importFile");

  if (!fileInput || fileInput.files.length === 0) {
    showToast("اختر ملف النسخة الاحتياطية أولاً", "error");
    return;
  }

  let file = fileInput.files[0];
  let reader = new FileReader();

  reader.onload = function (e) {
    try {
      let obj = JSON.parse(e.target.result);

      incoming = Array.isArray(obj.incoming) ? obj.incoming : [];
      outgoing = Array.isArray(obj.outgoing) ? obj.outgoing : [];
      stock = Array.isArray(obj.stock) ? obj.stock : [];

      selectedIncoming = new Set();
      selectedOutgoing = new Set();
      selectedStock = new Set();

      incomingPage = 1;
      outgoingPage = 1;
      stockPage = 1;

      incomingPerPage = incomingPerPage || 20;
      outgoingPerPage = outgoingPerPage || 20;
      stockPerPage = stockPerPage || 20;

      editIncomingIndex = null;
      editOutgoingIndex = null;

      recalcStock();
      saveLocal();

      showToast("تم استيراد النسخة الاحتياطية بنجاح");
      showHome();
    } catch (err) {
      showToast("فشل استيراد الملف، تأكد أنه ملف JSON صحيح", "error");
    }
  };

  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm("سيتم حذف جميع البيانات نهائيًا. هل أنت متأكد؟")) {
    return;
  }

  incoming = [];
  outgoing = [];
  stock = [];

  selectedIncoming = new Set();
  selectedOutgoing = new Set();
  selectedStock = new Set();

  incomingPage = 1;
  outgoingPage = 1;
  stockPage = 1;

  editIncomingIndex = null;
  editOutgoingIndex = null;

  saveLocal();

  showToast("تم حذف جميع البيانات");
  showHome();
}

/* =======================
   تحديث المخزون
======================= */
function updateStockIncoming(item) {
  if (!item || !item.name || !item.unit) return;

  let exist = stock.find(i => i.name === item.name && i.unit === item.unit);
  if (exist) {
    exist.qty += Number(item.qty || 0);
    if (item.notes) exist.notes = item.notes;
  } else {
    stock.push({
      name: item.name,
      qty: Number(item.qty || 0),
      unit: item.unit,
      notes: item.notes || ""
    });
  }
}

function updateStockOutgoing(item) {
  if (!item || !item.name || !item.unit) return;

  let exist = stock.find(i => i.name === item.name && i.unit === item.unit);
  if (exist) {
    exist.qty -= Number(item.qty || 0);
  }
}

function recalcStock() {
  stock = [];
  incoming.forEach(updateStockIncoming);
  outgoing.forEach(updateStockOutgoing);
  stock = stock.filter(i => Number(i.qty) > 0);
}

function toggleIncomingSelection(index, checkbox) {

  if (checkbox.checked) {
    selectedIncoming.add(index);
  } else {
    selectedIncoming.delete(index);
  }

}

function exportSelectedIncoming() {

  if (selectedIncoming.size === 0) {
    showToast("حدد عناصر أولاً", "error");
    return;
  }

  let rows = [];

  selectedIncoming.forEach((index, order) => {

    let i = incoming[index];

    rows.push({
      "#": order + 1,
      "التاريخ": i.date || "",
      "الصنف": i.name || "",
      "الكمية": i.qty || 0,
      "الوحدة": i.unit || "",
      "النوع": i.type || "",
      "سعر الوحدة": i.price || 0,
      "الإجمالي": i.total || (Number(i.qty || 0) * Number(i.price || 0)),
      "ملاحظات": i.notes || ""
    });

  });

  exportStyledExcel(rows, "الوارد المحدد", "الوارد_المحدد.xlsx");

}

function toggleSelectAllIncoming(source) {

  selectedIncoming.clear();

  if (source.checked) {
    incoming.forEach((_, index) => {
      selectedIncoming.add(index);
    });
  }

  renderIncoming();
}

/* =======================
   التصدير إلى Excel
======================= */

function exportIncoming() {
  if (incoming.length === 0) {
    showToast("لا توجد بيانات وارد للتصدير", "error");
    return;
  }

  let rows = incoming.map((i, idx) => ({
    "#": idx + 1,
    "التاريخ": i.date || "",
    "الصنف": i.name || "",
    "الكمية": i.qty || 0,
    "الوحدة": i.unit || "",
    "النوع": i.type || "",
    "سعر الوحدة": i.price || 0,
    "الإجمالي": i.total || (Number(i.qty || 0) * Number(i.price || 0)),
    "ملاحظات": i.notes || ""
  }));

  exportStyledExcel(rows, "الوارد", "الوارد.xlsx");
}

function exportOutgoing() {
  if (outgoing.length === 0) {
    showToast("لا توجد بيانات خارج للتصدير", "error");
    return;
  }

  let rows = outgoing.map((i, idx) => ({
    "#": idx + 1,
    "التاريخ": i.date || "",
    "الصنف": i.name || "",
    "الكمية": i.qty || 0,
    "الوحدة": i.unit || "",
    "ملاحظات": i.notes || ""
  }));

  exportStyledExcel(rows, "الخارج", "الخارج.xlsx");
}

function exportStock() {
  if (stock.length === 0) {
    showToast("لا يوجد مخزون للتصدير", "error");
    return;
  }

  let rows = stock.map((i, idx) => ({
    "#": idx + 1,
    "الصنف": i.name || "",
    "الكمية": i.qty || 0,
    "الوحدة": i.unit || "",
    "ملاحظات": i.notes || ""
  }));

  exportStyledExcel(rows, "المخزون", "المخزون.xlsx");
}

function exportStats() {
  if (incoming.length === 0 && outgoing.length === 0 && stock.length === 0) {
    showToast("لا توجد بيانات للتصدير", "error");
    return;
  }

  let wb = XLSX.utils.book_new();

  let incomingRows = incoming.map((i, idx) => ({
    "#": idx + 1,
    "التاريخ": i.date || "",
    "الصنف": i.name || "",
    "الكمية": i.qty || 0,
    "الوحدة": i.unit || "",
    "النوع": i.type || "",
    "سعر الوحدة": i.price || 0,
    "الإجمالي": i.total || (Number(i.qty || 0) * Number(i.price || 0)),
    "ملاحظات": i.notes || ""
  }));

  let outgoingRows = outgoing.map((i, idx) => ({
    "#": idx + 1,
    "التاريخ": i.date || "",
    "الصنف": i.name || "",
    "الكمية": i.qty || 0,
    "الوحدة": i.unit || "",
    "ملاحظات": i.notes || ""
  }));

  let stockRows = stock.map((i, idx) => ({
    "#": idx + 1,
    "الصنف": i.name || "",
    "الكمية الحالية": i.qty || 0,
    "الوحدة": i.unit || "",
    "ملاحظات": i.notes || ""
  }));

  let wsIncoming = createStyledWorksheet(incomingRows);
  let wsOutgoing = createStyledWorksheet(outgoingRows);
  let wsStock = createStyledWorksheet(stockRows);

  XLSX.utils.book_append_sheet(wb, wsIncoming, "الوارد");
  XLSX.utils.book_append_sheet(wb, wsOutgoing, "الخارج");
  XLSX.utils.book_append_sheet(wb, wsStock, "المخزون");

  XLSX.writeFile(wb, "الإحصائيات_الكاملة.xlsx");
  showToast("تم تصدير ملف الإحصائيات الكامل بنجاح");
}

function exportStyledExcel(rows, sheetName, fileName) {
  if (typeof XLSX === "undefined") {
    showToast("مكتبة Excel غير محملة", "error");
    return;
  }

  let wb = XLSX.utils.book_new();
  let ws = createStyledWorksheet(rows);

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
  showToast("تم التصدير بنجاح");
}

function createStyledWorksheet(rows) {
  let safeRows = rows.length ? rows : [{ "لا توجد بيانات": "" }];
  let ws = XLSX.utils.json_to_sheet(safeRows);

  let range = XLSX.utils.decode_range(ws["!ref"]);
  let totalCols = range.e.c + 1;
  let totalRows = range.e.r + 1;

  ws["!cols"] = [];
  for (let c = 0; c < totalCols; c++) {
    ws["!cols"].push({ wch: 18 });
  }

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      let cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) continue;

      ws[cellRef].s = {
        font: {
          name: "Arial",
          sz: 14,
          bold: r === 0
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true
        },
        border: {
          top: { style: "thin", color: { rgb: "999999" } },
          bottom: { style: "thin", color: { rgb: "999999" } },
          left: { style: "thin", color: { rgb: "999999" } },
          right: { style: "thin", color: { rgb: "999999" } }
        },
        fill: {
          fgColor: { rgb: r === 0 ? "1F7A63" : (c === 0 ? "E8F3F0" : "FFFFFF") }
        }
      };

      ws[cellRef].s.font.color = { rgb: r === 0 ? "FFFFFF" : "000000" };
    }
  }

  ws["!rows"] = [];
  for (let r = 0; r < totalRows; r++) {
    ws["!rows"].push({ hpt: r === 0 ? 24 : 22 });
  }

  return ws;
}