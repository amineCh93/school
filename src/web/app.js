const output = document.getElementById('output');
const authCard = document.getElementById('authCard');
const sessionInfo = document.getElementById('sessionInfo');
const roleHint = document.getElementById('roleHint');
const logoutBtn = document.getElementById('logoutBtn');
const statusMessage = document.getElementById('statusMessage');
const brandLogo = document.getElementById('brandLogo');
const brandName = document.getElementById('brandName');
const defaultLogoUrl = 'https://www.capgemini.com/wp-content/themes/capgemini2020/assets/images/logo.svg';

const state = {
  token: localStorage.getItem('portal.token') || '',
  role: localStorage.getItem('portal.role') || '',
  email: localStorage.getItem('portal.email') || ''
};

function print(data) {
  output.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

function updateStatus(message) {
  statusMessage.textContent = message;
}

function formatErrorMessage(error) {
  if (!error) {
    return 'An unexpected issue occurred while processing the request.';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.error && error.error.message) {
    return error.error.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'The operation could not be completed due to an unknown error.';
}

function describePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const data = payload.data;
  if (Array.isArray(data)) {
    return `Records returned: ${data.length}.`;
  }

  if (data && typeof data === 'object') {
    if (data._id) {
      return `Reference ID: ${data._id}.`;
    }
  }

  if (typeof payload.count === 'number') {
    return `Records returned: ${payload.count}.`;
  }

  return '';
}

function logEvent({ category, action, outcome, details = '', payload }) {
  const timestamp = new Date().toLocaleString();
  const summary = `${category} · ${action}`;
  const description = details || (outcome === 'Success'
    ? 'The operation completed successfully.'
    : 'The operation did not complete successfully.');
  const payloadHint = describePayload(payload);

  const eventMessage = [
    `[${timestamp}] ${summary}`,
    `Outcome: ${outcome}`,
    `Description: ${description}`,
    payloadHint
  ].filter(Boolean).join('\n');

  print(eventMessage);
  updateStatus(`${summary}: ${outcome}. ${description}`);
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
    updateStatus(`Session active for ${state.email} with ${state.role} privileges.`);
    applyRoleAccess();
  } else {
    sessionInfo.textContent = 'Not connected';
    roleHint.textContent = 'Role: Guest';
    updateStatus('No active session. Please register or log in to continue.');
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

async function loadBranding() {
  try {
    const payload = await api('/api/branding');
    if (payload.schoolName) {
      brandName.textContent = payload.schoolName;
      document.title = `${payload.schoolName} Portal`;
    }

    const nextLogo = payload.logoUrl || defaultLogoUrl;
    brandLogo.src = nextLogo;
    brandLogo.alt = payload.schoolName || 'School logo';
    logEvent({
      category: 'Branding',
      action: 'Load portal branding',
      outcome: 'Success',
      details: `Branding loaded from ${payload.source || 'default source'}.`,
      payload
    });
  } catch {
    brandLogo.src = defaultLogoUrl;
    logEvent({
      category: 'Branding',
      action: 'Load portal branding',
      outcome: 'Recovered',
      details: 'Fallback logo has been applied because branding data was unavailable.'
    });
  }
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

  logEvent({
    category: 'Dashboard',
    action: 'Refresh overview counters',
    outcome: 'Success',
    details: 'Dashboard metrics are synchronized with current records.',
    payload: {
      count: schools.data.length + headmasters.data.length + students.data.length
    }
  });
}

async function refreshSchools() {
  const payload = await api('/api/management/schools');
  const list = document.getElementById('schoolsList');
  list.innerHTML = payload.data.map((item) => `<li><strong>${item.name}</strong><br/>ID: ${item._id}<br/>Address: ${item.address}</li>`).join('');
  logEvent({
    category: 'Schools',
    action: 'Retrieve schools list',
    outcome: 'Success',
    details: 'School records have been refreshed and displayed.',
    payload
  });
  await refreshDashboard();
}

async function refreshHeadmasters() {
  const payload = await api('/api/management/headmasters');
  const list = document.getElementById('headmastersList');
  list.innerHTML = payload.data.map((item) => `<li><strong>${item.firstName} ${item.lastName}</strong><br/>ID: ${item._id}<br/>Email: ${item.email}</li>`).join('');
  logEvent({
    category: 'Headmasters',
    action: 'Retrieve headmasters list',
    outcome: 'Success',
    details: 'Headmaster records have been refreshed and displayed.',
    payload
  });
  await refreshDashboard();
}

async function refreshStudents() {
  const payload = await api('/api/management/students');
  const list = document.getElementById('studentsList');
  list.innerHTML = payload.data.map((item) => `<li><strong>${item.firstName} ${item.lastName}</strong><br/>ID: ${item._id}<br/>Email: ${item.email}</li>`).join('');
  logEvent({
    category: 'Students',
    action: 'Retrieve students list',
    outcome: 'Success',
    details: 'Student records have been refreshed and displayed.',
    payload
  });
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

    logEvent({
      category: 'Authentication',
      action: 'Register user account',
      outcome: 'Success',
      details: `Account has been created for ${email}.`,
      payload
    });
  } catch (error) {
    logEvent({
      category: 'Authentication',
      action: 'Register user account',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
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
    logEvent({
      category: 'Authentication',
      action: 'User login',
      outcome: 'Success',
      details: `${email} has signed in with ${role} access.`,
      payload
    });
  } catch (error) {
    logEvent({
      category: 'Authentication',
      action: 'User login',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
  }
});

logoutBtn.addEventListener('click', () => {
  const previousEmail = state.email;
  clearSession();
  updateCounters({ schools: 0, headmasters: 0, students: 0 });
  logEvent({
    category: 'Authentication',
    action: 'User logout',
    outcome: 'Success',
    details: previousEmail ? `${previousEmail} has signed out successfully.` : 'Session closed.'
  });
});

document.getElementById('createSchoolForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const name = document.getElementById('schoolName').value.trim();
    const address = document.getElementById('schoolAddress').value.trim();
    const logoUrlField = document.getElementById('schoolLogoUrl');
    const logoUrl = logoUrlField ? logoUrlField.value.trim() : '';
    const payload = await api('/api/management/schools', {
      method: 'POST',
      body: JSON.stringify({
        name,
        address,
        ...(logoUrl ? { logoUrl } : {})
      })
    });
    await refreshSchools();
    await loadBranding();
    logEvent({
      category: 'Schools',
      action: 'Create school',
      outcome: 'Success',
      details: `School ${name} has been created and is now available in the system.`,
      payload
    });
  } catch (error) {
    logEvent({
      category: 'Schools',
      action: 'Create school',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
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
    logEvent({
      category: 'Headmasters',
      action: 'Create headmaster',
      outcome: 'Success',
      details: `Headmaster ${firstName} ${lastName} has been created.`,
      payload
    });
  } catch (error) {
    logEvent({
      category: 'Headmasters',
      action: 'Create headmaster',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
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
    logEvent({
      category: 'Students',
      action: 'Create student',
      outcome: 'Success',
      details: `Student ${firstName} ${lastName} has been created.`,
      payload
    });
  } catch (error) {
    logEvent({
      category: 'Students',
      action: 'Create student',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
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
    logEvent({
      category: 'Interactions',
      action: 'Assign headmaster to school',
      outcome: 'Success',
      details: `Headmaster ${headmasterId} has been assigned to school ${schoolId}.`,
      payload
    });
  } catch (error) {
    logEvent({
      category: 'Interactions',
      action: 'Assign headmaster to school',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
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
    logEvent({
      category: 'Interactions',
      action: 'Enroll student to school',
      outcome: 'Success',
      details: `Student ${studentId} has been enrolled in school ${schoolId}.`,
      payload
    });
  } catch (error) {
    logEvent({
      category: 'Interactions',
      action: 'Enroll student to school',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
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
    logEvent({
      category: 'Interactions',
      action: 'Transfer student',
      outcome: 'Success',
      details: `Student ${studentId} has been transferred to school ${targetSchoolId}.`,
      payload
    });
  } catch (error) {
    logEvent({
      category: 'Interactions',
      action: 'Transfer student',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
  }
});

document.getElementById('refreshSchoolsBtn').addEventListener('click', () => refreshSchools().catch((error) => {
  logEvent({
    category: 'Schools',
    action: 'Retrieve schools list',
    outcome: 'Failed',
    details: formatErrorMessage(error)
  });
}));
document.getElementById('refreshHeadmastersBtn').addEventListener('click', () => refreshHeadmasters().catch((error) => {
  logEvent({
    category: 'Headmasters',
    action: 'Retrieve headmasters list',
    outcome: 'Failed',
    details: formatErrorMessage(error)
  });
}));
document.getElementById('refreshStudentsBtn').addEventListener('click', () => refreshStudents().catch((error) => {
  logEvent({
    category: 'Students',
    action: 'Retrieve students list',
    outcome: 'Failed',
    details: formatErrorMessage(error)
  });
}));

setSessionUI();
brandLogo.addEventListener('error', () => {
  if (brandLogo.src !== defaultLogoUrl) {
    brandLogo.src = defaultLogoUrl;
  }
});

loadBranding().catch(() => {});
if (state.token) {
  refreshDashboard().catch((error) => {
    logEvent({
      category: 'Dashboard',
      action: 'Refresh overview counters',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
  });
  refreshSchools().catch((error) => {
    logEvent({
      category: 'Schools',
      action: 'Retrieve schools list',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
  });
  refreshHeadmasters().catch((error) => {
    logEvent({
      category: 'Headmasters',
      action: 'Retrieve headmasters list',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
  });
  refreshStudents().catch((error) => {
    logEvent({
      category: 'Students',
      action: 'Retrieve students list',
      outcome: 'Failed',
      details: formatErrorMessage(error)
    });
  });
}
