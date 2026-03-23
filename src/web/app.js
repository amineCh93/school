const output = document.getElementById('output');
const authCard = document.getElementById('authCard');
const sessionInfo = document.getElementById('sessionInfo');
const roleHint = document.getElementById('roleHint');
const logoutBtn = document.getElementById('logoutBtn');

const state = {
  token: localStorage.getItem('portal.token') || '',
  role: localStorage.getItem('portal.role') || '',
  email: localStorage.getItem('portal.email') || ''
};

function print(data) {
  output.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const text = await response.text();
  let payload = {};

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw payload;
  }

  return payload;
}

function applyRoleAccess() {
  document.querySelectorAll('[data-role]').forEach((section) => {
    const allowed = section.dataset.role.split(',').map((item) => item.trim());
    section.classList.toggle('hidden', !allowed.includes(state.role));
  });
}

function setSessionUI() {
  const loggedIn = Boolean(state.token);

  authCard.classList.toggle('hidden', loggedIn);
  logoutBtn.classList.toggle('hidden', !loggedIn);

  if (loggedIn) {
    sessionInfo.textContent = `Logged in as ${state.email} (${state.role})`;
    roleHint.textContent = `Current role: ${state.role}`;
    applyRoleAccess();
  } else {
    sessionInfo.textContent = 'Not connected';
    roleHint.textContent = 'Role: Guest';
    document.querySelectorAll('[data-role]').forEach((section) => section.classList.add('hidden'));
  }
}

function persistSession() {
  localStorage.setItem('portal.token', state.token);
  localStorage.setItem('portal.role', state.role);
  localStorage.setItem('portal.email', state.email);
}

function clearSession() {
  state.token = '';
  state.role = '';
  state.email = '';
  persistSession();
  setSessionUI();
}

function updateCounters({ schools = 0, headmasters = 0, students = 0 }) {
  document.getElementById('schoolsCount').textContent = String(schools);
  document.getElementById('headmastersCount').textContent = String(headmasters);
  document.getElementById('studentsCount').textContent = String(students);
}

async function refreshDashboard() {
  const [schools, headmasters, students] = await Promise.all([
    api('/api/management/schools').catch(() => ({ data: [] })),
    api('/api/management/headmasters').catch(() => ({ data: [] })),
    api('/api/management/students').catch(() => ({ data: [] }))
  ]);

  updateCounters({
    schools: schools.data.length,
    headmasters: headmasters.data.length,
    students: students.data.length
  });
}

async function refreshSchools() {
  const payload = await api('/api/management/schools');
  const list = document.getElementById('schoolsList');
  list.innerHTML = payload.data.map((item) => `<li><strong>${item.name}</strong><br/>ID: ${item._id}<br/>Address: ${item.address}</li>`).join('');
  print(payload);
  await refreshDashboard();
}

async function refreshHeadmasters() {
  const payload = await api('/api/management/headmasters');
  const list = document.getElementById('headmastersList');
  list.innerHTML = payload.data.map((item) => `<li><strong>${item.firstName} ${item.lastName}</strong><br/>ID: ${item._id}<br/>Email: ${item.email}</li>`).join('');
  print(payload);
  await refreshDashboard();
}

async function refreshStudents() {
  const payload = await api('/api/management/students');
  const list = document.getElementById('studentsList');
  list.innerHTML = payload.data.map((item) => `<li><strong>${item.firstName} ${item.lastName}</strong><br/>ID: ${item._id}<br/>Email: ${item.email}</li>`).join('');
  print(payload);
  await refreshDashboard();
}

document.getElementById('registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    const payload = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    print(payload);
  } catch (error) {
    print(error);
  }
});

document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    const payload = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    state.token = payload.token;
    state.role = role;
    state.email = email;
    persistSession();
    setSessionUI();
    await refreshDashboard();
    print(payload);
  } catch (error) {
    print(error);
  }
});

logoutBtn.addEventListener('click', () => {
  clearSession();
  updateCounters({ schools: 0, headmasters: 0, students: 0 });
  print('Session closed.');
});

document.getElementById('createSchoolForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const name = document.getElementById('schoolName').value.trim();
    const address = document.getElementById('schoolAddress').value.trim();
    const payload = await api('/api/management/schools', {
      method: 'POST',
      body: JSON.stringify({ name, address })
    });
    await refreshSchools();
    print(payload);
  } catch (error) {
    print(error);
  }
});

document.getElementById('createHeadmasterForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const firstName = document.getElementById('headmasterFirstName').value.trim();
    const lastName = document.getElementById('headmasterLastName').value.trim();
    const email = document.getElementById('headmasterEmail').value.trim();
    const payload = await api('/api/management/headmasters', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email })
    });
    await refreshHeadmasters();
    print(payload);
  } catch (error) {
    print(error);
  }
});

document.getElementById('createStudentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const firstName = document.getElementById('studentFirstName').value.trim();
    const lastName = document.getElementById('studentLastName').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const payload = await api('/api/management/students', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email })
    });
    await refreshStudents();
    print(payload);
  } catch (error) {
    print(error);
  }
});

document.getElementById('assignHeadmasterForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const schoolId = document.getElementById('assignSchoolId').value.trim();
    const headmasterId = document.getElementById('assignHeadmasterId').value.trim();
    const payload = await api('/api/management/interactions/assign-headmaster', {
      method: 'POST',
      body: JSON.stringify({ schoolId, headmasterId })
    });
    print(payload);
  } catch (error) {
    print(error);
  }
});

document.getElementById('enrollStudentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const schoolId = document.getElementById('enrollSchoolId').value.trim();
    const studentId = document.getElementById('enrollStudentId').value.trim();
    const payload = await api('/api/management/interactions/enroll-student', {
      method: 'POST',
      body: JSON.stringify({ schoolId, studentId })
    });
    print(payload);
  } catch (error) {
    print(error);
  }
});

document.getElementById('transferStudentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const studentId = document.getElementById('transferStudentId').value.trim();
    const targetSchoolId = document.getElementById('targetSchoolId').value.trim();
    const payload = await api('/api/management/interactions/transfer-student', {
      method: 'POST',
      body: JSON.stringify({ studentId, targetSchoolId })
    });
    print(payload);
  } catch (error) {
    print(error);
  }
});

document.getElementById('refreshSchoolsBtn').addEventListener('click', () => refreshSchools().catch(print));
document.getElementById('refreshHeadmastersBtn').addEventListener('click', () => refreshHeadmasters().catch(print));
document.getElementById('refreshStudentsBtn').addEventListener('click', () => refreshStudents().catch(print));

setSessionUI();
if (state.token) {
  refreshDashboard().catch(() => {});
  refreshSchools().catch(() => {});
  refreshHeadmasters().catch(() => {});
  refreshStudents().catch(() => {});
}
