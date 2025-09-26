// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCA3ECMlIUGr9lh56y4lfcv2Laehxxln2A",
  authDomain: "homework-website-236e8.firebaseapp.com",
  projectId: "homework-website-236e8",
  storageBucket: "homework-website-236e8.firebasestorage.app",
  messagingSenderId: "111412349330",
  appId: "1:111412349330:web:30f429000a07a3fd13194b",
  measurementId: "G-BYR8YTGDFL"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();

// Global variables
let currentUser = null;
let homeworkList = [];
let classesList = [];
let selectedClass = 'all';
let unsubscribe = null;
let classesUnsubscribe = null;
let isClassSwitching = false; // Flag to track when we're switching classes

// Testing function - View indicator
function updateViewIndicator() {
    const indicator = document.getElementById('view-indicator');
    if (!indicator) return;
    
    const isMobile = window.innerWidth < 768;
    indicator.className = `view-indicator ${isMobile ? 'mobile' : 'desktop'}`;
    
    // Log for debugging
    console.log(`📱 View Mode: ${isMobile ? 'MOBILE (Green)' : 'DESKTOP (Red)'} - Screen width: ${window.innerWidth}px`);
}

// Initialize view indicator
updateViewIndicator();
window.addEventListener('resize', () => {
    updateViewIndicator();
    // Re-render homework list when switching between mobile/desktop
    // Don't trigger animations during resize
    if (homeworkList && homeworkList.length > 0) {
        isClassSwitching = false; // Disable animations for resize
        renderHomeworkList();
    }
});

// Debug function - call this from browser console to test Firebase connection
window.testFirebaseConnection = function() {
    console.log('=== Firebase Connection Test ===');
    console.log('Current user:', currentUser);
    console.log('Firebase app:', app);
    console.log('Firestore instance:', db);
    
    if (!currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    // Test reading from classes collection
    db.collection('classes').where('userId', '==', currentUser.uid).get()
        .then((snapshot) => {
            console.log('✅ Successfully read classes collection');
            console.log('Number of classes:', snapshot.size);
            snapshot.forEach((doc) => {
                console.log('Class:', doc.id, doc.data());
            });
        })
        .catch((error) => {
            console.error('❌ Error reading classes:', error);
        });
    
    // Test writing to classes collection
    const testClass = {
        className: 'Test Class',
        userId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('classes').add(testClass)
        .then((docRef) => {
            console.log('✅ Successfully wrote to classes collection');
            console.log('Test class ID:', docRef.id);
            
            // Clean up test class
            return docRef.delete();
        })
        .then(() => {
            console.log('✅ Test class cleaned up');
        })
        .catch((error) => {
            console.error('❌ Error writing to classes:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
        });
};

// Calendar variables
let currentCalendarDate = new Date();
let selectedDate = null;

// DOM elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const googleSigninBtn = document.getElementById('google-signin-btn');
const signoutBtn = document.getElementById('signout-btn');
const authError = document.getElementById('auth-error');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const homeworkForm = document.getElementById('homework-form');
const homeworkListElement = document.getElementById('homework-list');
const emptyState = document.getElementById('empty-state');
const loadingSpinner = document.getElementById('loading-spinner');
const homeworkSectionTitle = document.getElementById('homework-section-title');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
// Theme label removed - now icon-only design
const themeDropdown = document.getElementById('theme-dropdown');
const themeOptions = document.querySelectorAll('.theme-option');
const addHomeworkBtn = document.getElementById('add-homework-btn');
const addHomeworkModal = document.getElementById('add-homework-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');

// Weekly homework elements
const addWeeklyHomeworkBtn = document.getElementById('add-weekly-homework-btn');
const weeklyHomeworkModal = document.getElementById('weekly-homework-modal');
const weeklyHomeworkForm = document.getElementById('weekly-homework-form');
const closeWeeklyModalBtn = document.getElementById('close-weekly-modal');
const cancelWeeklyBtn = document.getElementById('cancel-weekly-btn');
const weeklyDueTimeInput = document.getElementById('weekly-due-time');
const weeklyTimeIndicator = document.getElementById('weeklyTimeIndicator');


// Class management elements
const manageClassesBtn = document.getElementById('manage-classes-btn');
const classManagementModal = document.getElementById('class-management-modal');
const classForm = document.getElementById('class-form');
const closeClassModalBtn = document.getElementById('close-class-modal');
const cancelClassBtn = document.getElementById('cancel-class-btn');
const classesListElement = document.getElementById('classes-list');
const noClassesState = document.getElementById('no-classes-state');
const classColorInput = document.getElementById('class-color');
const colorPreview = document.getElementById('color-preview');

// Time input elements
const dueTimeInput = document.getElementById('due-time');
const timeIndicator = document.getElementById('timeIndicator');

// Calendar elements
const calendarBtn = document.getElementById('calendar-btn');
const calendarModal = document.getElementById('calendar-modal');
const calendarCloseBtn = document.getElementById('calendar-close-btn');
const dueDateInput = document.getElementById('due-date');
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarDays = document.getElementById('calendar-days');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const todayBtn = document.getElementById('today-btn');
const clearDateBtn = document.getElementById('clear-date-btn');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize theme
    initializeTheme();
    
    // Set up event listeners
    setupEventListeners();
    
    // Listen for authentication state changes
    auth.onAuthStateChanged(handleAuthStateChange);
}

function setupEventListeners() {
    // Authentication
    googleSigninBtn.addEventListener('click', signInWithGoogle);
    signoutBtn.addEventListener('click', handleSignOut);
    
    // Modal functionality
    addHomeworkBtn.addEventListener('click', openAddHomeworkModal);
    closeModalBtn.addEventListener('click', closeAddHomeworkModal);
    cancelBtn.addEventListener('click', closeAddHomeworkModal);
    
    // Mobile FAB functionality
    const mobileFab = document.getElementById('mobile-fab');
    if (mobileFab) {
        mobileFab.addEventListener('click', openAddHomeworkModal);
    }
    
    // Weekly homework modal functionality
    addWeeklyHomeworkBtn.addEventListener('click', openWeeklyHomeworkModal);
    closeWeeklyModalBtn.addEventListener('click', closeWeeklyHomeworkModal);
    cancelWeeklyBtn.addEventListener('click', closeWeeklyHomeworkModal);
    
    
    // Class management modal functionality
    manageClassesBtn.addEventListener('click', openClassManagementModal);
    closeClassModalBtn.addEventListener('click', closeClassManagementModal);
    cancelClassBtn.addEventListener('click', closeClassManagementModal);
    
    // Time input indicators
    if (dueTimeInput && timeIndicator) {
        dueTimeInput.addEventListener('input', () => updateTimeIndicator(dueTimeInput, timeIndicator));
        // Initialize with current value or default
        updateTimeIndicator(dueTimeInput, timeIndicator);
    }
    
    // Weekly homework time input indicators
    if (weeklyDueTimeInput && weeklyTimeIndicator) {
        weeklyDueTimeInput.addEventListener('input', () => updateTimeIndicator(weeklyDueTimeInput, weeklyTimeIndicator));
        // Initialize with current value or default
        updateTimeIndicator(weeklyDueTimeInput, weeklyTimeIndicator);
    }
    
    
    // Close modal when clicking outside
    addHomeworkModal.addEventListener('click', (e) => {
        if (e.target === addHomeworkModal) {
            closeAddHomeworkModal();
        }
    });
    
    
    classManagementModal.addEventListener('click', (e) => {
        if (e.target === classManagementModal) {
            closeClassManagementModal();
        }
    });
    
    // Close weekly homework modal when clicking outside
    weeklyHomeworkModal.addEventListener('click', (e) => {
        if (e.target === weeklyHomeworkModal) {
            closeWeeklyHomeworkModal();
        }
    });
    
    // Form submission
    homeworkForm.addEventListener('submit', handleAddHomework);
    weeklyHomeworkForm.addEventListener('submit', handleAddWeeklyHomework);
    classForm.addEventListener('submit', handleAddClass);
    
    // Color picker functionality
    if (classColorInput && colorPreview) {
        classColorInput.addEventListener('input', updateColorPreview);
        updateColorPreview(); // Initialize
    }
    
    // Calendar functionality
    setupCalendarEventListeners();
    
}

// Authentication functions
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    showLoading(true);
    
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Sign in successful:', result.user);
            hideAuthError();
        })
        .catch((error) => {
            console.error('Sign in error:', error);
            showAuthError('Failed to sign in. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

function handleSignOut() {
    auth.signOut()
        .then(() => {
            console.log('Sign out successful');
        })
        .catch((error) => {
            console.error('Sign out error:', error);
        });
}

function handleAuthStateChange(user) {
    if (user) {
        currentUser = user;
        showApp();
        updateUserInfo(user);
        setupRealtimeListener();
        setupClassesListener();
    } else {
        currentUser = null;
        showAuth();
        cleanupRealtimeListener();
        cleanupClassesListener();
    }
}

function showAuth() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
}

function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.add('hidden');
    setTimeout(() => {
        appSection.classList.remove('hidden');
        // Ensure class navigation is rendered when app is shown
        if (classesList && classesList.length > 0) {
            renderClassNavigation();
        }
    }, 100);
}

function updateUserInfo(user) {
    userAvatar.src = user.photoURL || '';
    userAvatar.alt = user.displayName || 'User Avatar';
    userName.textContent = user.displayName || user.email;
}

function showAuthError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
}

function hideAuthError() {
    authError.style.display = 'none';
}

// Modal functions
function openAddHomeworkModal() {
    document.body.classList.add('modal-open');
    addHomeworkModal.classList.remove('hidden');
    // Trigger animation by adding show class after a brief delay
    setTimeout(() => {
        addHomeworkModal.classList.add('show');
    }, 10);
    // Focus on first input after animation starts
    setTimeout(() => {
        document.getElementById('title').focus();
    }, 300);
}

function closeAddHomeworkModal() {
    // Add closing class and remove show class to trigger exit animation
    addHomeworkModal.classList.add('closing');
    addHomeworkModal.classList.remove('show');
    // Hide modal after animation completes
    setTimeout(() => {
        addHomeworkModal.classList.add('hidden');
        addHomeworkModal.classList.remove('closing');
        document.body.classList.remove('modal-open');
        // Reset form and calendar
        resetForm();
        hideCalendar();
    }, 300);
}

// Weekly Homework Modal Functions
function openWeeklyHomeworkModal() {
    document.body.classList.add('modal-open');
    weeklyHomeworkModal.classList.remove('hidden');
    // Trigger animation by adding show class after a brief delay
    setTimeout(() => {
        weeklyHomeworkModal.classList.add('show');
    }, 10);
    // Focus on first input after animation starts
    setTimeout(() => {
        document.getElementById('weekly-title').focus();
    }, 300);
}

function closeWeeklyHomeworkModal() {
    // Add closing class and remove show class to trigger exit animation
    weeklyHomeworkModal.classList.add('closing');
    weeklyHomeworkModal.classList.remove('show');
    // Hide modal after animation completes
    setTimeout(() => {
        weeklyHomeworkModal.classList.add('hidden');
        weeklyHomeworkModal.classList.remove('closing');
        document.body.classList.remove('modal-open');
        // Reset form
        resetWeeklyForm();
    }, 300);
}


// Homework management functions
function handleAddHomework(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showAuthError('Please sign in to add homework');
        return;
    }
    
    const formData = new FormData(homeworkForm);
    const homework = {
        title: formData.get('title').trim(),
        subject: formData.get('subject'),
        dueDate: formData.get('dueDate'),
        dueTime: formData.get('dueTime') || '23:59',
        priority: formData.get('priority') || 'medium',
        description: formData.get('description').trim(),
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: currentUser.uid
    };
    
    // Validate form
    if (!homework.title || !homework.subject || !homework.dueDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    showLoading(true);
    
    db.collection('homework').add(homework)
        .then((docRef) => {
            console.log('Homework added with ID:', docRef.id);
            homeworkForm.reset();
            hideAuthError();
            closeAddHomeworkModal();
        })
        .catch((error) => {
            console.error('Error adding homework:', error);
            alert('Failed to add homework. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

// NEW WEEKLY HOMEWORK SYSTEM - SIMPLE AND CLEAN
function handleAddWeeklyHomework(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showAuthError('Please sign in to add weekly homework');
        return;
    }
    
    const formData = new FormData(weeklyHomeworkForm);
    const weeklyData = {
        title: formData.get('title').trim(),
        subject: formData.get('subject'),
        dueDay: parseInt(formData.get('dueDay')),
        dueTime: formData.get('dueTime') || '23:59',
        priority: formData.get('priority') || 'medium',
        description: formData.get('description').trim(),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate') || null,
        isWeekly: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: currentUser.uid
    };
    
    // Validate form
    if (!weeklyData.title || !weeklyData.subject || weeklyData.dueDay === '' || !weeklyData.startDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    showLoading(true);
    
    // Create the first weekly assignment
    createFirstWeeklyAssignment(weeklyData)
        .then(() => {
            console.log('Weekly homework created successfully');
            weeklyHomeworkForm.reset();
            hideAuthError();
            closeWeeklyHomeworkModal();
        })
        .catch((error) => {
            console.error('Error creating weekly homework:', error);
            alert('Failed to create weekly homework. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

function createFirstWeeklyAssignment(weeklyData) {
    const startDate = new Date(weeklyData.startDate);
    const endDate = weeklyData.endDate ? new Date(weeklyData.endDate) : null;
    
    // Find the first occurrence of the due day after the start date
    let dueDate = new Date(startDate);
    while (dueDate.getDay() !== weeklyData.dueDay) {
        dueDate.setDate(dueDate.getDate() + 1);
    }
    
    // Check if we're within the end date range (if specified)
    if (endDate && dueDate > endDate) {
        throw new Error('No assignments can be created - the start date is after the end date for this weekly assignment.');
    }
    
    // Create the first assignment
    const assignment = {
        title: weeklyData.title,
        subject: weeklyData.subject,
        dueDate: formatDateForInput(dueDate),
        dueTime: weeklyData.dueTime,
        priority: weeklyData.priority,
        description: weeklyData.description,
        status: 'pending',
        isWeekly: true,
        weeklyDay: weeklyData.dueDay,
        weeklyEndDate: weeklyData.endDate,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: currentUser.uid
    };
    
    return db.collection('homework').add(assignment);
}

function resetWeeklyForm() {
    weeklyHomeworkForm.reset();
    
    // Reset time indicator
    if (weeklyDueTimeInput && weeklyTimeIndicator) {
        updateTimeIndicator(weeklyDueTimeInput, weeklyTimeIndicator);
    }
}


// Class Management Functions
function openClassManagementModal() {
    classManagementModal.classList.remove('hidden');
    setTimeout(() => {
        classManagementModal.classList.add('show');
    }, 10);
    setTimeout(() => {
        document.getElementById('class-name').focus();
    }, 300);
}

function closeClassManagementModal() {
    classManagementModal.classList.add('closing');
    classManagementModal.classList.remove('show');
    setTimeout(() => {
        classManagementModal.classList.add('hidden');
        classManagementModal.classList.remove('closing');
        resetClassForm();
    }, 300);
}

function handleAddClass(e) {
    e.preventDefault();
    
    console.log('handleAddClass called');
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
        console.error('No current user found');
        showAuthError('Please sign in to add classes');
        return;
    }
    
    const formData = new FormData(classForm);
    const classData = {
        className: formData.get('className').trim(),
        classCode: formData.get('classCode').trim(),
        teacher: formData.get('teacher').trim(),
        color: formData.get('color'),
        description: formData.get('description').trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: currentUser.uid
    };
    
    console.log('Class data to be added:', classData);
    
    // Validate form
    if (!classData.className) {
        alert('Please enter a class name');
        return;
    }
    
    showLoading(true);
    
    console.log('Attempting to add class to Firebase...');
    
    db.collection('classes').add(classData)
        .then((docRef) => {
            console.log('✅ Class added successfully with ID:', docRef.id);
            classForm.reset();
            hideAuthError();
            closeClassManagementModal();
        })
        .catch((error) => {
            console.error('❌ Error adding class:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            alert(`Failed to add class: ${error.message}`);
        })
        .finally(() => {
            showLoading(false);
        });
}

function setupClassesListener() {
    if (!currentUser) return;
    
    console.log('Setting up classes listener for user:', currentUser.uid);
    
    classesUnsubscribe = db.collection('classes')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            console.log('Classes snapshot received:', snapshot.size, 'documents');
            classesList = [];
            snapshot.forEach((doc) => {
                console.log('Class document:', doc.id, doc.data());
                classesList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('Classes list updated:', classesList);
            renderClassesList();
            updateClassDropdowns();
        }, (error) => {
            console.error('Error listening to classes updates:', error);
        });
}

function cleanupClassesListener() {
    if (classesUnsubscribe) {
        classesUnsubscribe();
        classesUnsubscribe = null;
    }
    classesList = [];
    renderClassesList();
    updateClassDropdowns();
}

function renderClassesList() {
    console.log('renderClassesList called');
    console.log('Rendering classes list. Total:', classesList.length);
    console.log('classesList data:', classesList);
    
    if (classesList.length === 0) {
        classesListElement.innerHTML = '';
        noClassesState.style.display = 'block';
        console.log('Showing no classes state');
        // Still update class navigation to show "All Classes" only
        renderClassNavigation();
        return;
    }
    
    noClassesState.style.display = 'none';
    console.log('Rendering', classesList.length, 'classes');
    
    classesListElement.innerHTML = classesList.map(classItem => 
        createClassItemHTML(classItem)
    ).join('');
    
    // Add event listeners to class action buttons
    addClassActionButtonListeners();
    
    // Update class navigation to show all classes
    renderClassNavigation();
}

function createClassItemHTML(classItem) {
    const colorStyle = classItem.color ? `style="background-color: ${classItem.color}"` : '';
    const classCode = classItem.classCode ? `<span class="class-code">${escapeHtml(classItem.classCode)}</span>` : '';
    const teacher = classItem.teacher ? `<div class="class-teacher">${escapeHtml(classItem.teacher)}</div>` : '';
    const description = classItem.description ? `<div class="class-description">${escapeHtml(classItem.description)}</div>` : '';
    
    // Count homework for this class
    const homeworkCount = homeworkList.filter(homework => homework.subject === classItem.className).length;
    
    return `
        <div class="class-item" data-id="${classItem.id}">
            <div class="class-header">
                <div class="class-color-indicator" ${colorStyle}></div>
                <div class="class-info">
                    <h4 class="class-name">${escapeHtml(classItem.className)}</h4>
                    ${classCode}
                    ${teacher}
                    ${description}
                </div>
                <div class="class-stats">
                    <span class="homework-count">${homeworkCount} assignment${homeworkCount !== 1 ? 's' : ''}</span>
                </div>
            </div>
            <div class="class-actions">
                <button class="action-btn edit-class-btn" data-id="${classItem.id}" title="Edit Class">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-class-btn" data-id="${classItem.id}" title="Delete Class">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function addClassActionButtonListeners() {
    const classesListElement = document.getElementById('classes-list');
    
    // Remove existing listeners to prevent duplicates
    classesListElement.removeEventListener('click', handleClassActionButtonClick);
    
    // Add single event listener for all class action buttons
    classesListElement.addEventListener('click', handleClassActionButtonClick);
}

function handleClassActionButtonClick(e) {
    const actionBtn = e.target.closest('.action-btn');
    if (!actionBtn) return;
    
    const id = actionBtn.dataset.id;
    if (!id) {
        console.error('Class action button missing data-id attribute');
        return;
    }
    
    console.log('Class action button clicked:', actionBtn.classList.toString(), 'ID:', id);
    
    if (actionBtn.classList.contains('edit-class-btn')) {
        console.log('Edit class button clicked for ID:', id);
        editClass(id);
    } else if (actionBtn.classList.contains('delete-class-btn')) {
        console.log('Delete class button clicked for ID:', id);
        deleteClass(id);
    }
}

function editClass(id) {
    console.log('editClass called with ID:', id);
    const classItem = classesList.find(c => c.id === id);
    if (!classItem) {
        console.error('Class not found with ID:', id);
        return;
    }
    console.log('Found class for editing:', classItem);
    
    // Populate form with existing data
    document.getElementById('class-name').value = classItem.className;
    document.getElementById('class-code').value = classItem.classCode || '';
    document.getElementById('class-teacher').value = classItem.teacher || '';
    document.getElementById('class-color').value = classItem.color || '#3b82f6';
    document.getElementById('class-description').value = classItem.description || '';
    
    // Update color preview
    updateColorPreview();
    
    // Open modal for editing
    openClassManagementModal();
    
    // Update form to edit mode
    const submitBtn = document.querySelector('.class-form .submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Class';
    submitBtn.dataset.editId = id;
    
    // Change form handler temporarily
    classForm.removeEventListener('submit', handleAddClass);
    classForm.addEventListener('submit', (e) => handleUpdateClass(e, id));
}

function handleUpdateClass(e, id) {
    e.preventDefault();
    
    const formData = new FormData(classForm);
    const updatedClass = {
        className: formData.get('className').trim(),
        classCode: formData.get('classCode').trim(),
        teacher: formData.get('teacher').trim(),
        color: formData.get('color'),
        description: formData.get('description').trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    showLoading(true);
    
    db.collection('classes').doc(id).update(updatedClass)
        .then(() => {
            console.log('Class updated successfully');
            resetClassForm();
        })
        .catch((error) => {
            console.error('Error updating class:', error);
            alert('Failed to update class. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

function deleteClass(id) {
    console.log('deleteClass called with ID:', id);
    if (!confirm('Are you sure you want to delete this class? This will not delete any homework assignments.')) {
        console.log('User cancelled class deletion');
        return;
    }
    console.log('User confirmed class deletion, proceeding...');
    
    showLoading(true);
    
    db.collection('classes').doc(id).delete()
        .then(() => {
            console.log('Class deleted successfully');
        })
        .catch((error) => {
            console.error('Error deleting class:', error);
            alert('Failed to delete class. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

function resetClassForm() {
    classForm.reset();
    const submitBtn = document.querySelector('.class-form .submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Class';
    submitBtn.removeAttribute('data-edit-id');
    
    // Reset color to default
    document.getElementById('class-color').value = '#3b82f6';
    updateColorPreview();
    
    // Restore original form handler
    classForm.removeEventListener('submit', handleUpdateClass);
    classForm.addEventListener('submit', handleAddClass);
}

function updateColorPreview() {
    if (classColorInput && colorPreview) {
        const color = classColorInput.value;
        colorPreview.style.backgroundColor = color;
    }
}

function updateClassDropdowns() {
    const subjectSelect = document.getElementById('subject');
    const weeklySubjectSelect = document.getElementById('weekly-subject');
    
    // Update regular homework dropdown
    if (subjectSelect) {
        // Keep the first option (Select Class)
        const firstOption = subjectSelect.querySelector('option');
        subjectSelect.innerHTML = '';
        subjectSelect.appendChild(firstOption);
        
        // Add class options
        classesList.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.className;
            option.textContent = classItem.className;
            subjectSelect.appendChild(option);
        });
    }
    
    // Update weekly homework dropdown
    if (weeklySubjectSelect) {
        // Keep the first option (Select Class)
        const firstOption = weeklySubjectSelect.querySelector('option');
        weeklySubjectSelect.innerHTML = '';
        weeklySubjectSelect.appendChild(firstOption);
        
        // Add class options
        classesList.forEach(classItem => {
            const option = document.createElement('option');
            option.value = classItem.className;
            option.textContent = classItem.className;
            weeklySubjectSelect.appendChild(option);
        });
    }
}

// Time indicator functions
function getTimeIndicator(timeString) {
    if (!timeString) return 'Evening';
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    if (totalMinutes === 0) return 'Midnight';
    if (totalMinutes < 360) return 'Night'; // 0:00 - 5:59
    if (totalMinutes < 720) return 'Morning'; // 6:00 - 11:59
    if (totalMinutes < 780) return 'Noon'; // 12:00 - 12:59
    if (totalMinutes < 1080) return 'Afternoon'; // 13:00 - 17:59
    if (totalMinutes < 1320) return 'Evening'; // 18:00 - 21:59
    return 'Night'; // 22:00 - 23:59
}

function updateTimeIndicator(input, indicator) {
    const timeValue = input.value;
    
    if (!timeValue) {
        indicator.textContent = 'No time set';
        indicator.className = 'time-indicator no-time';
        return;
    }
    
    const indicatorText = getTimeIndicator(timeValue);
    indicator.textContent = indicatorText;
    indicator.className = `time-indicator ${indicatorText.toLowerCase()}`;
}

function formatTimeForDisplay(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const indicator = getTimeIndicator(timeString);
    
    // Convert to 12-hour format for display
    let displayHours = hours;
    let ampm = 'AM';
    
    if (hours === 0) {
        displayHours = 12;
    } else if (hours === 12) {
        ampm = 'PM';
    } else if (hours > 12) {
        displayHours = hours - 12;
        ampm = 'PM';
    }
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm} (${indicator})`;
}

function setupRealtimeListener() {
    if (!currentUser) return;
    
    console.log('Setting up realtime listener for user:', currentUser.uid);
    
    unsubscribe = db.collection('homework')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
        console.log('Snapshot received:', snapshot.size, 'documents');
        homeworkList = [];
        snapshot.forEach((doc) => {
            console.log('Document:', doc.id, doc.data());
            homeworkList.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('Homework list updated:', homeworkList);
        
        // Render homework list
        renderHomeworkList();
    }, (error) => {
        console.error('Error listening to homework updates:', error);
    });
}

function cleanupRealtimeListener() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    homeworkList = [];
    renderHomeworkList();
}

function renderHomeworkList() {
    console.log('Rendering homework list. Total:', homeworkList.length);
    
    // Render class navigation (only creates buttons if they don't exist)
    renderClassNavigation();
    
    // Filter by selected class
    let classFilteredHomework = selectedClass === 'all' 
        ? homeworkList 
        : homeworkList.filter(homework => homework.subject === selectedClass);
    
    // Apply the same filtering logic used for counting
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at midnight
    
    const beforeFilterCount = classFilteredHomework.length;
    classFilteredHomework = classFilteredHomework.filter(homework => {
        // If it's not weekly homework, always show it
        if (!homework.isWeekly) {
            return true;
        }
        
        // For weekly homework, check if it should be shown
        if (homework.dueDate) {
            const dueDate = homework.dueDate.toDate ? homework.dueDate.toDate() : new Date(homework.dueDate);
            const homeworkDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            
            // If it's due today or in the past, always show it
            if (homeworkDueDate <= today) {
                return true;
            }
            
            // If it's due in the future, check if it's a "next week" assignment
            // and if the "current week" assignment's due date has passed
            const isNextWeekAssignment = homeworkDueDate > today;
            
            if (isNextWeekAssignment) {
                // For weekly assignments due in the future, show them if they're due within the next 7 days
                // This prevents clutter from assignments too far in the future
                const daysUntilDue = Math.ceil((homeworkDueDate - today) / (1000 * 60 * 60 * 24));
                if (daysUntilDue <= 7) {
                    console.log(`Showing weekly assignment: ${homework.title} (due in ${daysUntilDue} days)`);
                    return true;
                } else {
                    console.log(`Hiding weekly assignment: ${homework.title} (due in ${daysUntilDue} days, too far in future)`);
                    return false;
                }
            }
            
            // Default: hide future assignments
            console.log(`Hiding future weekly assignment: ${homework.title} (due ${homeworkDueDate.toDateString()})`);
            return false;
        }
        
        // If no due date, show it
        return true;
    });
    
    const filteredOutCount = beforeFilterCount - classFilteredHomework.length;
    if (filteredOutCount > 0) {
        console.log(`Filtered out ${filteredOutCount} future weekly assignments`);
    }
    
    // Update section title
    if (selectedClass === 'all') {
        homeworkSectionTitle.textContent = 'All Homework';
    } else {
        homeworkSectionTitle.textContent = `${selectedClass} Homework`;
    }
    
    if (classFilteredHomework.length === 0) {
        homeworkListElement.innerHTML = '';
        emptyState.style.display = 'block';
        console.log('Showing empty state for class:', selectedClass);
        return;
    }
    
    emptyState.style.display = 'none';
    console.log('Rendering', classFilteredHomework.length, 'homework items for class:', selectedClass);
    
    // Organize homework by completion status
    const pendingHomework = classFilteredHomework.filter(h => h.status === 'pending');
    const completedHomework = classFilteredHomework.filter(h => h.status === 'completed');
    
    // Separate recent completed (due within 2 weeks) from old completed (due more than 2 weeks ago)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const recentCompleted = completedHomework.filter(h => {
        if (!h.dueDate) return false;
        const dueDate = h.dueDate.toDate ? h.dueDate.toDate() : new Date(h.dueDate);
        return dueDate >= twoWeeksAgo;
    });
    
    const oldCompleted = completedHomework.filter(h => {
        if (!h.dueDate) return true; // If no due date, consider it old
        const dueDate = h.dueDate.toDate ? h.dueDate.toDate() : new Date(h.dueDate);
        return dueDate < twoWeeksAgo;
    });
    
    console.log('Organizing homework:', {
        pending: pendingHomework.length,
        recentCompleted: recentCompleted.length,
        oldCompleted: oldCompleted.length
    });
    
    // Build HTML with sections
    let html = '';
    
    // Pending homework section
    if (pendingHomework.length > 0) {
        html += `
            <div class="homework-section pending-section">
                <div class="section-header">
                    <div class="section-title-container">
                        <div class="section-icon pending-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="section-title-content">
                            <h3 class="section-title">Pending Assignments</h3>
                            <p class="section-subtitle">${pendingHomework.length} assignment${pendingHomework.length !== 1 ? 's' : ''} waiting to be completed</p>
                        </div>
                    </div>
                    <div class="section-actions">
                        <button class="section-action-btn" onclick="sortHomeworkBy('dueDate')" title="Sort by due date">
                            <i class="fas fa-sort-amount-down"></i>
                        </button>
                        <button class="section-action-btn" onclick="sortHomeworkBy('priority')" title="Sort by priority">
                            <i class="fas fa-exclamation-circle"></i>
                        </button>
                    </div>
                </div>
                <div class="homework-section-content">
                    ${pendingHomework.map(homework => createHomeworkItemHTML(homework)).join('')}
                </div>
            </div>
        `;
    }
    
    // Recent completed section
    if (recentCompleted.length > 0) {
        html += `
            <div class="homework-section completed-section">
                <div class="section-header">
                    <div class="section-title-container">
                        <div class="section-icon completed-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="section-title-content">
                            <h3 class="section-title">Recently Completed</h3>
                            <p class="section-subtitle">${recentCompleted.length} assignment${recentCompleted.length !== 1 ? 's' : ''} completed (due within 2 weeks)</p>
                        </div>
                    </div>
                    <div class="section-actions">
                        <button class="section-action-btn" onclick="sortHomeworkBy('completedAt')" title="Sort by completion date">
                            <i class="fas fa-calendar-check"></i>
                        </button>
                        <button class="section-action-btn" onclick="toggleCompletedSection()" title="Collapse/Expand section">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                    </div>
                </div>
                <div class="homework-section-content">
                    ${recentCompleted.map(homework => createHomeworkItemHTML(homework)).join('')}
                </div>
            </div>
        `;
    }
    
    // Add small button to view old completed homework if any exist
    if (oldCompleted.length > 0) {
        html += `
            <div class="past-homework-button-container">
                <button class="past-homework-small-btn" onclick="openPastHomeworkModal()" title="View past homework">
                    <i class="fas fa-history"></i>
                    <span class="past-homework-count">${oldCompleted.length}</span>
                </button>
            </div>
        `;
    }
    
    homeworkListElement.innerHTML = html;
    
    // Apply animation class only when switching classes
    if (isClassSwitching) {
        homeworkListElement.classList.add('animate-homework-items');
        // Remove the class after animation completes
        setTimeout(() => {
            homeworkListElement.classList.remove('animate-homework-items');
        }, 1000); // Match the longest animation delay
    } else {
        homeworkListElement.classList.remove('animate-homework-items');
    }
    
    // Reset the flag
    isClassSwitching = false;
    
    // Add event listeners to action buttons
    addActionButtonListeners();
}

function getVisibleHomeworkCount(homeworkArray) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at midnight
    
    return homeworkArray.filter(homework => {
        // If it's not weekly homework, always show it
        if (!homework.isWeekly) {
            return true;
        }
        
        // For weekly homework, check if it should be shown
        if (homework.dueDate) {
            const dueDate = homework.dueDate.toDate ? homework.dueDate.toDate() : new Date(homework.dueDate);
            const homeworkDueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            
            // If it's due today or in the past, always show it
            if (homeworkDueDate <= today) {
                return true;
            }
            
            // If it's due in the future, check if it's a "next week" assignment
            // and if the "current week" assignment's due date has passed
            const isNextWeekAssignment = homeworkDueDate > today;
            
            if (isNextWeekAssignment) {
                // For weekly assignments due in the future, show them if they're due within the next 7 days
                // This prevents clutter from assignments too far in the future
                const daysUntilDue = Math.ceil((homeworkDueDate - today) / (1000 * 60 * 60 * 24));
                return daysUntilDue <= 7;
            }
            
            // Default: hide future assignments
            return false;
        }
        
        // If no due date, show it
        return true;
    }).length;
}

function renderClassNavigation() {
    const classNavElement = document.getElementById('classNav');
    const mobileClassNavElement = document.getElementById('mobileClassNav');
    const mobileClassSwitcher = document.getElementById('mobile-class-switcher');
    
    console.log('renderClassNavigation called');
    console.log('classesList:', classesList);
    console.log('classNavElement:', classNavElement);
    console.log('mobileClassNavElement:', mobileClassNavElement);
    console.log('mobileClassSwitcher:', mobileClassSwitcher);
    
    // Get all classes from classesList (not just those with homework)
    const allClassNames = classesList.map(classItem => classItem.className);
    console.log('allClassNames:', allClassNames);
    
    // Create navigation buttons with consistent filtering
    const navButtons = [
        {
            id: 'all',
            name: 'All Classes',
            count: getVisibleHomeworkCount(homeworkList)
        },
        ...allClassNames.map(className => ({
            id: className,
            name: className,
            count: getVisibleHomeworkCount(homeworkList.filter(homework => homework.subject === className))
        }))
    ];
    
    // Desktop navigation
    classNavElement.innerHTML = navButtons.map(btn => `
        <button class="class-nav-btn" data-class="${btn.id}">
            ${btn.name}
            <span class="count">${btn.count}</span>
        </button>
    `).join('');
    
    // Mobile navigation
    const mobileClassNavButtons = document.getElementById('mobile-class-nav-buttons');
    mobileClassNavButtons.innerHTML = navButtons.map(btn => `
        <button class="mobile-class-nav-btn" data-class="${btn.id}">
            <span class="class-name">${btn.name}</span>
            <span class="class-count">${btn.count} assignments</span>
        </button>
    `).join('');
    
    // Update mobile class switcher
    const activeButton = navButtons.find(btn => btn.id === selectedClass);
    if (mobileClassSwitcher) {
        const switcherText = mobileClassSwitcher.querySelector('.switcher-text');
        if (switcherText) {
            if (activeButton) {
                switcherText.textContent = activeButton.name;
                mobileClassSwitcher.classList.add('active');
            } else {
                switcherText.textContent = 'All Classes';
                mobileClassSwitcher.classList.remove('active');
            }
        }
    }
    
    // Add event listeners to desktop class navigation buttons (only if not already added)
    if (classNavElement && !classNavElement.hasAttribute('data-listeners-added')) {
        classNavElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('class-nav-btn')) {
                selectedClass = e.target.dataset.class;
                updateClassNavigationActiveState();
                isClassSwitching = true; // Enable animations for class switching
                renderHomeworkList();
            }
        });
        classNavElement.setAttribute('data-listeners-added', 'true');
    }
    
    // Add event listeners to mobile class navigation buttons (only if not already added)
    if (mobileClassNavButtons && !mobileClassNavButtons.hasAttribute('data-listeners-added')) {
        console.log('✅ Mobile class nav buttons found, adding event listener');
        mobileClassNavButtons.addEventListener('click', (e) => {
            console.log('📱 Mobile class nav button clicked:', e.target);
            if (e.target.classList.contains('mobile-class-nav-btn')) {
                console.log('📱 Valid mobile class nav button clicked, class:', e.target.dataset.class);
                selectedClass = e.target.dataset.class;
                updateClassNavigationActiveState();
                isClassSwitching = true; // Enable animations for class switching
                renderHomeworkList();
                // Close mobile nav after selection
                if (mobileClassNavElement) {
                    mobileClassNavElement.classList.remove('show');
                }
            }
        });
        mobileClassNavButtons.setAttribute('data-listeners-added', 'true');
    } else if (!mobileClassNavButtons) {
        console.error('❌ Mobile class nav buttons not found');
    }
    
    // Add event listener to mobile class switcher (only if not already added)
    if (mobileClassSwitcher && !mobileClassSwitcher.hasAttribute('data-listeners-added')) {
        console.log('✅ Mobile class switcher found, adding event listener');
        mobileClassSwitcher.addEventListener('click', () => {
            console.log('📱 Mobile class switcher clicked');
            // Toggle mobile class nav visibility
            if (mobileClassNavElement) {
                console.log('📱 Toggling mobile class nav visibility');
                console.log('📱 Current classes:', mobileClassNavElement.className);
                mobileClassNavElement.classList.toggle('show');
                console.log('📱 After toggle classes:', mobileClassNavElement.className);
                console.log('📱 Has show class:', mobileClassNavElement.classList.contains('show'));
            } else {
                console.error('❌ Mobile class nav element not found');
            }
        });
        mobileClassSwitcher.setAttribute('data-listeners-added', 'true');
    } else if (!mobileClassSwitcher) {
        console.error('❌ Mobile class switcher not found');
    }
    
    // Add event listener to close button (only if not already added)
    const mobileClassNavClose = document.getElementById('mobile-class-nav-close');
    if (mobileClassNavClose && !mobileClassNavClose.hasAttribute('data-listeners-added')) {
        console.log('✅ Mobile class nav close button found, adding event listener');
        mobileClassNavClose.addEventListener('click', () => {
            console.log('📱 Mobile class nav close button clicked');
            if (mobileClassNavElement) {
                console.log('📱 Removing show class from mobile class nav');
                mobileClassNavElement.classList.remove('show');
                console.log('📱 After remove classes:', mobileClassNavElement.className);
            } else {
                console.error('❌ Mobile class nav element not found for close');
            }
        });
        mobileClassNavClose.setAttribute('data-listeners-added', 'true');
    } else if (!mobileClassNavClose) {
        console.error('❌ Mobile class nav close button not found');
    }
    
    // Update active state
    updateClassNavigationActiveState();
}

function updateClassNavigationActiveState() {
    const classNavElement = document.getElementById('classNav');
    const mobileClassNavElement = document.getElementById('mobileClassNav');
    const mobileClassSwitcher = document.getElementById('mobile-class-switcher');
    
    // Update desktop navigation
    if (classNavElement) {
        const buttons = classNavElement.querySelectorAll('.class-nav-btn');
        buttons.forEach(button => {
            if (button.dataset.class === selectedClass) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    // Update mobile navigation
    const mobileClassNavButtons = document.getElementById('mobile-class-nav-buttons');
    if (mobileClassNavButtons) {
        const mobileButtons = mobileClassNavButtons.querySelectorAll('.mobile-class-nav-btn');
        mobileButtons.forEach(button => {
            if (button.dataset.class === selectedClass) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    // Update mobile class switcher
    if (mobileClassSwitcher) {
        const switcherText = mobileClassSwitcher.querySelector('.switcher-text');
        if (switcherText) {
            const allButtons = [
                ...(classNavElement ? classNavElement.querySelectorAll('.class-nav-btn') : []),
                ...(mobileClassNavButtons ? mobileClassNavButtons.querySelectorAll('.mobile-class-nav-btn') : [])
            ];
            const activeButton = allButtons.find(btn => btn.dataset.class === selectedClass);
            if (activeButton) {
                const className = activeButton.querySelector('.class-name')?.textContent || activeButton.textContent.replace(/\s*\d+\s*assignments?\s*$/, '');
                switcherText.textContent = className;
                mobileClassSwitcher.classList.add('active');
            } else {
                switcherText.textContent = 'All Classes';
                mobileClassSwitcher.classList.remove('active');
            }
        }
    }
}

function createHomeworkItemHTML(homework) {
    const dueDate = homework.dueDate ? new Date(homework.dueDate).toLocaleDateString() : 'No date';
    const timeDisplay = homework.dueTime ? formatTimeForDisplay(homework.dueTime) : '';
    const fullDueDate = timeDisplay ? `${dueDate} at ${timeDisplay}` : dueDate;
    const isOverdue = homework.dueDate && new Date(homework.dueDate) < new Date() && homework.status !== 'completed';
    
    // Calculate days until due
    let daysUntilDue = '';
    if (homework.dueDate) {
        const today = new Date();
        const due = new Date(homework.dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            daysUntilDue = `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
        } else if (diffDays === 0) {
            daysUntilDue = 'Due today';
        } else if (diffDays === 1) {
            daysUntilDue = 'Due tomorrow';
        } else {
            daysUntilDue = `Due in ${diffDays} days`;
        }
    }
    
    // Determine neon status class
    let neonStatusClass = '';
    if (homework.dueDate) {
        const today = new Date();
        const due = new Date(homework.dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0 && homework.status !== 'completed') {
            neonStatusClass = 'homework-status-bar overdue';
        } else if (diffDays === 0 && homework.status !== 'completed') {
            neonStatusClass = 'homework-status-bar due-today';
        } else if (diffDays === 1 && homework.status !== 'completed') {
            neonStatusClass = 'homework-status-bar due-tomorrow';
        }
    }
    
    // Check if mobile view
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
        // Ultra-compact mobile card layout - only essential info
        const today = new Date();
        const due = homework.dueDate ? new Date(homework.dueDate) : null;
        let priorityClass = '';
        
        if (due && homework.status !== 'completed') {
            const diffTime = due - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                priorityClass = 'urgent';
            } else if (diffDays === 0) {
                priorityClass = 'due-today';
            } else if (diffDays === 1) {
                priorityClass = 'due-tomorrow';
            }
        }
        
        // Create abbreviated due date for mobile
        let abbreviatedDueDate = dueDate;
        if (homework.dueDate) {
            const due = new Date(homework.dueDate);
            const today = new Date();
            const diffTime = due - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                abbreviatedDueDate = `${Math.abs(diffDays)}d ago`;
            } else if (diffDays === 0) {
                abbreviatedDueDate = 'Today';
            } else if (diffDays === 1) {
                abbreviatedDueDate = 'Tomorrow';
            } else if (diffDays <= 7) {
                abbreviatedDueDate = `${diffDays}d`;
            } else {
                // Show abbreviated date format like "12/25"
                abbreviatedDueDate = `${due.getMonth() + 1}/${due.getDate()}`;
            }
        }
        
        return `
            <div class="homework-item ${homework.status} ${priorityClass}" data-id="${homework.id}">
                <div class="homework-card-content">
                    <div class="homework-main-content">
                        <h3 class="homework-title">${escapeHtml(homework.title)}</h3>
                    </div>
                    <div class="homework-meta-stack">
                        <div class="homework-class">${escapeHtml(homework.subject)}</div>
                        <div class="due-date-compact">
                            <i class="fas fa-calendar-alt"></i>
                            <span class="due-date">${abbreviatedDueDate}</span>
                        </div>
                    </div>
                    <div class="homework-actions">
                        ${homework.status === 'pending' ? `
                            <button class="homework-action-btn complete" data-id="${homework.id}" title="Mark Complete">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : `
                            <button class="homework-action-btn complete" data-id="${homework.id}" title="Mark Pending">
                                <i class="fas fa-undo"></i>
                            </button>
                        `}
                        <button class="homework-action-btn edit" data-id="${homework.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Desktop layout (original)
        return `
            <div class="homework-item ${homework.status} ${homework.priority || 'medium'}-priority ${isOverdue ? 'overdue' : ''} ${neonStatusClass}" data-id="${homework.id}">
                <div class="homework-main">
                    <h3 class="homework-title">
                        ${escapeHtml(homework.title)}
                        ${homework.isWeekly ? '<span class="weekly-indicator" title="Weekly Assignment"><i class="fas fa-calendar-week"></i></span>' : ''}
                    </h3>
                    <span class="homework-subject">${escapeHtml(homework.subject)}</span>
                </div>
                <div class="due-date-main">
                    <div class="due-date ${isOverdue ? 'overdue' : ''}">${fullDueDate}</div>
                    <div class="days-until ${isOverdue ? 'overdue' : ''}">${daysUntilDue}</div>
                </div>
                <div class="homework-status">
                    <span class="status-badge ${homework.status}">${homework.status.replace('-', ' ')}</span>
                </div>
                <div class="homework-actions">
                    ${homework.status === 'pending' ? `
                        <button class="action-btn complete-btn" data-id="${homework.id}" title="Mark as Completed">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : `
                        <button class="action-btn uncomplete-btn" data-id="${homework.id}" title="Mark as Pending">
                            <i class="fas fa-undo"></i>
                        </button>
                    `}
                    <button class="action-btn edit-btn" data-id="${homework.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${homework.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
}

function addActionButtonListeners() {
    // Use event delegation for better performance and reliability
    const homeworkListElement = document.getElementById('homework-list');
    
    // Remove existing listeners to prevent duplicates
    homeworkListElement.removeEventListener('click', handleActionButtonClick);
    
    // Add single event listener for all action buttons
    homeworkListElement.addEventListener('click', handleActionButtonClick);
}

function handleActionButtonClick(e) {
    // Handle both desktop (.action-btn) and mobile (.homework-action-btn) buttons
    const actionBtn = e.target.closest('.action-btn') || e.target.closest('.homework-action-btn');
    if (!actionBtn) return;
    
    const id = actionBtn.dataset.id;
    if (!id) {
        console.error('Action button missing data-id attribute');
        return;
    }
    
    console.log('Action button clicked:', actionBtn.classList.toString(), 'ID:', id);
    
    if (actionBtn.classList.contains('complete-btn') || actionBtn.classList.contains('complete')) {
        console.log('Complete button clicked for ID:', id);
        markHomeworkCompleted(id);
    } else if (actionBtn.classList.contains('uncomplete-btn') || actionBtn.classList.contains('uncomplete')) {
        console.log('Uncomplete button clicked for ID:', id);
        markHomeworkPending(id);
    } else if (actionBtn.classList.contains('edit-btn') || actionBtn.classList.contains('edit')) {
        console.log('Edit button clicked for ID:', id);
        editHomework(id);
    } else if (actionBtn.classList.contains('delete-btn') || actionBtn.classList.contains('delete')) {
        console.log('Delete button clicked for ID:', id);
        deleteHomework(id);
    }
}

function editHomework(id) {
    console.log('editHomework called with ID:', id);
    const homework = homeworkList.find(h => h.id === id);
    if (!homework) {
        console.error('Homework not found with ID:', id);
        return;
    }
    console.log('Found homework for editing:', homework);
    
    // Check if this is weekly homework
    if (homework.isWeekly) {
        editWeeklyHomework(homework);
    } else {
        editRegularHomework(homework);
    }
}

function editRegularHomework(homework) {
    // Populate regular homework form with existing data
    document.getElementById('title').value = homework.title;
    document.getElementById('subject').value = homework.subject;
    document.getElementById('due-date').value = homework.dueDate;
    document.getElementById('due-time').value = homework.dueTime || '23:59';
    document.getElementById('priority').value = homework.priority || '';
    document.getElementById('description').value = homework.description || '';
    
    // Update time indicator
    if (dueTimeInput && timeIndicator) {
        updateTimeIndicator(dueTimeInput, timeIndicator);
    }
    
    // Set selected date for calendar
    if (homework.dueDate) {
        selectedDate = parseDateFromInput(homework.dueDate);
        currentCalendarDate = new Date(selectedDate);
    }
    
    // Open modal for editing
    openAddHomeworkModal();
    
    // Update form to edit mode
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Homework';
    submitBtn.dataset.editId = homework.id;
    
    // Change form handler temporarily
    homeworkForm.removeEventListener('submit', handleAddHomework);
    homeworkForm.addEventListener('submit', (e) => handleUpdateHomework(e, homework.id));
}

function editWeeklyHomework(homework) {
    // Populate weekly homework form with existing data
    document.getElementById('weekly-title').value = homework.title;
    document.getElementById('weekly-subject').value = homework.subject;
    document.getElementById('weekly-due-day').value = homework.weeklyDay || '';
    document.getElementById('weekly-due-time').value = homework.dueTime || '23:59';
    document.getElementById('weekly-priority').value = homework.priority || '';
    document.getElementById('weekly-description').value = homework.description || '';
    
    // Set start date (use the original start date if available, otherwise use current due date)
    if (homework.startDate) {
        document.getElementById('weekly-start-date').value = homework.startDate;
    } else if (homework.dueDate) {
        // Convert due date to start date format
        const dueDate = homework.dueDate.toDate ? homework.dueDate.toDate() : new Date(homework.dueDate);
        const startDate = new Date(dueDate);
        startDate.setDate(startDate.getDate() - (homework.weeklyDay || 0)); // Go back to start of week
        document.getElementById('weekly-start-date').value = startDate.toISOString().split('T')[0];
    }
    
    // Set end date if available
    if (homework.endDate) {
        document.getElementById('weekly-end-date').value = homework.endDate;
    }
    
    // Open weekly homework modal for editing
    openWeeklyHomeworkModal();
    
    // Update form to edit mode
    const submitBtn = document.querySelector('#weekly-homework-form .submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Weekly Assignment';
    submitBtn.dataset.editId = homework.id;
    
    // Change form handler temporarily
    weeklyHomeworkForm.removeEventListener('submit', handleAddWeeklyHomework);
    weeklyHomeworkForm.addEventListener('submit', (e) => handleUpdateWeeklyHomework(e, homework.id));
}

function handleUpdateHomework(e, id) {
    e.preventDefault();
    
    const formData = new FormData(homeworkForm);
    const updatedHomework = {
        title: formData.get('title').trim(),
        subject: formData.get('subject'),
        dueDate: formData.get('dueDate'),
        dueTime: formData.get('dueTime') || '23:59',
        priority: formData.get('priority') || 'medium',
        description: formData.get('description').trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    showLoading(true);
    
    db.collection('homework').doc(id).update(updatedHomework)
        .then(() => {
            console.log('Homework updated successfully');
            resetForm();
        })
        .catch((error) => {
            console.error('Error updating homework:', error);
            alert('Failed to update homework. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

function handleUpdateWeeklyHomework(e, id) {
    e.preventDefault();
    
    if (!currentUser) {
        showAuthError('Please sign in to update weekly homework');
        return;
    }
    
    const formData = new FormData(weeklyHomeworkForm);
    const updatedWeeklyData = {
        title: formData.get('title').trim(),
        subject: formData.get('subject'),
        weeklyDay: parseInt(formData.get('dueDay')), // Use weeklyDay for database field
        dueTime: formData.get('dueTime') || '23:59',
        priority: formData.get('priority') || 'medium',
        description: formData.get('description').trim(),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate') || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Validate form
    if (!updatedWeeklyData.title || !updatedWeeklyData.subject || updatedWeeklyData.weeklyDay === '' || !updatedWeeklyData.startDate) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Calculate new due date based on updated weeklyDay and startDate
    const startDate = new Date(updatedWeeklyData.startDate);
    let dueDate = new Date(startDate);
    while (dueDate.getDay() !== updatedWeeklyData.weeklyDay) {
        dueDate.setDate(dueDate.getDate() + 1);
    }
    updatedWeeklyData.dueDate = formatDateForInput(dueDate);
    
    showLoading(true);
    
    // Update the weekly homework
    db.collection('homework').doc(id).update(updatedWeeklyData)
        .then(() => {
            console.log('Weekly homework updated successfully');
            weeklyHomeworkForm.reset();
            hideAuthError();
            closeWeeklyHomeworkModal();
        })
        .catch((error) => {
            console.error('Error updating weekly homework:', error);
            alert('Failed to update weekly homework. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

function deleteHomework(id) {
    console.log('deleteHomework called with ID:', id);
    if (!confirm('Are you sure you want to delete this homework?')) {
        console.log('User cancelled deletion');
        return;
    }
    console.log('User confirmed deletion, proceeding...');
    
    showLoading(true);
    
    db.collection('homework').doc(id).delete()
        .then(() => {
            console.log('Homework deleted successfully');
        })
        .catch((error) => {
            console.error('Error deleting homework:', error);
            alert('Failed to delete homework. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

// REMOVED: Complex weekly homework status checking
// New system handles weekly homework automatically when marked complete

function markHomeworkCompleted(id) {
    console.log('markHomeworkCompleted called with ID:', id);
    
    // Trigger celebration animation immediately for responsive feedback
    triggerCelebrationAnimation();
    
    // Find the homework item to check if it's weekly
    const homeworkItem = homeworkList.find(h => h.id === id);
    
    // Update database in background
    db.collection('homework').doc(id).update({
        status: 'completed',
        completedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Homework marked as completed successfully');
        
        // NEW SIMPLE LOGIC: If this is weekly homework, create next week's assignment immediately
        if (homeworkItem && homeworkItem.isWeekly && homeworkItem.weeklyDay !== undefined) {
            createNextWeekAssignment(homeworkItem);
        }
    })
    .catch((error) => {
        console.error('Error marking homework as completed:', error);
        alert('Failed to mark homework as completed. Please try again.');
    });
}

function createNextWeekAssignment(completedHomework) {
    console.log('Creating next week assignment from completed homework:', completedHomework);
    
    const now = new Date();
    const dayOfWeek = completedHomework.weeklyDay;
    
    // Find next week's occurrence of this day
    let nextDate = new Date(now);
    
    // Find the current week's occurrence of this day
    while (nextDate.getDay() !== dayOfWeek) {
        nextDate.setDate(nextDate.getDate() + 1);
    }
    
    // Move to next week
    nextDate.setDate(nextDate.getDate() + 7);
    
    // Check if we're within the end date range (if specified)
    if (completedHomework.weeklyEndDate) {
        const endDate = new Date(completedHomework.weeklyEndDate);
        if (nextDate > endDate) {
            console.log('Next weekly assignment would be after end date, skipping creation');
            return;
        }
    }
    
    // SAFETY CHECK: Prevent duplicate creation by checking if next week's assignment already exists
    const nextWeekDateString = formatDateForInput(nextDate);
    const existingAssignment = homeworkList.find(h => 
        h.title === completedHomework.title && 
        h.subject === completedHomework.subject && 
        h.dueDate === nextWeekDateString &&
        h.isWeekly === true
    );
    
    if (existingAssignment) {
        console.log('Next week assignment already exists, skipping creation:', existingAssignment.id);
        return;
    }
    
    // Parse the due time
    const [hours, minutes] = completedHomework.dueTime.split(':').map(Number);
    const dueDateTime = new Date(nextDate);
    dueDateTime.setHours(hours, minutes, 0, 0);
    
    // Create the next assignment using the completed homework's data
    const nextAssignment = {
        title: completedHomework.title,
        subject: completedHomework.subject,
        dueDate: formatDateForInput(dueDateTime),
        dueTime: completedHomework.dueTime,
        priority: completedHomework.priority,
        description: completedHomework.description,
        status: 'pending',
        isWeekly: true,
        weeklyDay: completedHomework.weeklyDay,
        weeklyEndDate: completedHomework.weeklyEndDate,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        userId: currentUser.uid
    };
    
    // Add to database
    db.collection('homework').add(nextAssignment)
        .then((docRef) => {
            console.log('Next week assignment created with ID:', docRef.id, 'for next week:', nextDate.toDateString());
        })
        .catch((error) => {
            console.error('Error creating next week assignment:', error);
        });
}

function markHomeworkPending(id) {
    console.log('markHomeworkPending called with ID:', id);
    
    showLoading(true);
    
    db.collection('homework').doc(id).update({
        status: 'pending',
        completedAt: firebase.firestore.FieldValue.delete(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Homework marked as pending successfully');
    })
    .catch((error) => {
        console.error('Error marking homework as pending:', error);
        alert('Failed to mark homework as pending. Please try again.');
    })
    .finally(() => {
        showLoading(false);
        });
}


// Past Homework Modal Functions
function openPastHomeworkModal() {
    const modal = document.getElementById('pastHomeworkModal');
    if (!modal) {
        console.error('Past homework modal not found');
        return;
    }
    
    renderPastHomeworkList();
    modal.classList.add('show');
    
    // Add click-outside-to-close functionality
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePastHomeworkModal();
        }
    });
}


function closePastHomeworkModal() {
    const modal = document.getElementById('pastHomeworkModal');
    modal.classList.remove('show');
}

function renderPastHomeworkList() {
    const pastHomeworkListElement = document.getElementById('pastHomeworkList');
    
    // Get all homework and filter for old completed ones (due more than 2 weeks ago)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const oldCompleted = homeworkList.filter(h => {
        if (h.status !== 'completed') return false;
        if (!h.dueDate) return true; // If no due date, consider it old
        const dueDate = h.dueDate.toDate ? h.dueDate.toDate() : new Date(h.dueDate);
        return dueDate < twoWeeksAgo;
    });
    
    if (oldCompleted.length === 0) {
        pastHomeworkListElement.innerHTML = '<p class="no-past-homework">No past homework found.</p>';
        return;
    }
    
    pastHomeworkListElement.innerHTML = oldCompleted.map(homework => 
        createPastHomeworkItemHTML(homework)
    ).join('');
}

function createPastHomeworkItemHTML(homework) {
    const dueDate = homework.dueDate ? new Date(homework.dueDate).toLocaleDateString() : 'No date';
    const completedDate = homework.completedAt ? 
        (homework.completedAt.toDate ? homework.completedAt.toDate() : new Date(homework.completedAt)).toLocaleDateString() : 
        'Unknown';
    
    return `
        <div class="past-homework-item" data-id="${homework.id}">
            <label class="past-homework-checkbox">
                <input type="checkbox" class="past-homework-select" data-id="${homework.id}" onchange="updateDeleteButtonState()">
                <span class="checkmark"></span>
            </label>
            <div class="past-homework-content">
                <h4 class="past-homework-title">${escapeHtml(homework.title)}</h4>
                <div class="past-homework-details">
                    <span class="past-homework-subject">${escapeHtml(homework.subject)}</span>
                    <span class="past-homework-due">Due: ${dueDate}</span>
                    <span class="past-homework-completed">Completed: ${completedDate}</span>
                </div>
            </div>
        </div>
    `;
}

function selectAllPastHomework() {
    const checkboxes = document.querySelectorAll('.past-homework-select');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    updateDeleteButtonState();
}

function deselectAllPastHomework() {
    const checkboxes = document.querySelectorAll('.past-homework-select');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateDeleteButtonState();
}

function updateDeleteButtonState() {
    const selectedCheckboxes = document.querySelectorAll('.past-homework-select:checked');
    const deleteButton = document.getElementById('pastHomeworkDeleteBtn');
    const selectedCount = document.getElementById('pastHomeworkSelectedCount');
    
    if (selectedCheckboxes.length > 0) {
        deleteButton.classList.add('enabled');
        selectedCount.textContent = `${selectedCheckboxes.length} selected`;
    } else {
        deleteButton.classList.remove('enabled');
        selectedCount.textContent = '0 selected';
    }
}

// Section control functions
function sortHomeworkBy(criteria) {
    console.log('Sorting homework by:', criteria);
    
    // Update the global sort criteria
    currentSortCriteria = criteria;
    
    // Re-render the homework list with new sorting
    renderHomeworkList();
}

function toggleCompletedSection() {
    const completedSection = document.querySelector('.completed-section');
    const content = completedSection.querySelector('.homework-section-content');
    const toggleBtn = completedSection.querySelector('.section-action-btn:last-child i');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggleBtn.className = 'fas fa-chevron-up';
    } else {
        content.style.display = 'none';
        toggleBtn.className = 'fas fa-chevron-down';
    }
}

function deleteSelectedPastHomework() {
    const selectedCheckboxes = document.querySelectorAll('.past-homework-select:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.id);
    
    if (selectedIds.length === 0) {
        alert('Please select homework to delete.');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} completed homework assignment${selectedIds.length !== 1 ? 's' : ''}? This action cannot be undone.`)) {
        return;
    }
    
    showLoading(true);
    
    const deletePromises = selectedIds.map(id => 
        db.collection('homework').doc(id).delete()
    );
    
    Promise.all(deletePromises)
        .then(() => {
            console.log('Selected past homework deleted successfully');
            renderPastHomeworkList();
            updateDeleteButtonState();
            // Refresh the main homework list to update the button count
            renderHomeworkList();
        })
        .catch((error) => {
            console.error('Error deleting selected past homework:', error);
            alert('Failed to delete some homework. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

function updateHomeworkStatus(id, currentStatus) {
    let newStatus;
    switch (currentStatus) {
        case 'pending':
            newStatus = 'in-progress';
            break;
        case 'in-progress':
            newStatus = 'completed';
            break;
        case 'completed':
            newStatus = 'pending';
            break;
        default:
            return;
    }
    
    showLoading(true);
    
    db.collection('homework').doc(id).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
        .then(() => {
            console.log('Homework status updated successfully');
        })
        .catch((error) => {
            console.error('Error updating homework status:', error);
            alert('Failed to update homework status. Please try again.');
        })
        .finally(() => {
            showLoading(false);
        });
}

function resetForm() {
    homeworkForm.reset();
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Homework';
    submitBtn.removeAttribute('data-edit-id');
    
    // Reset calendar state
    selectedDate = null;
    currentCalendarDate = new Date();
    
    // Restore original form handler
    homeworkForm.removeEventListener('submit', handleUpdateHomework);
    homeworkForm.addEventListener('submit', handleAddHomework);
}

// Filtering and sorting functions
function getFilteredHomework() {
    let filtered = [...homeworkList];
    
    // Apply filters
    if (filterSubject.value) {
        filtered = filtered.filter(h => h.subject === filterSubject.value);
    }
    
    if (filterPriority.value) {
        filtered = filtered.filter(h => (h.priority || 'medium') === filterPriority.value);
    }
    
    if (filterStatus.value) {
        filtered = filtered.filter(h => h.status === filterStatus.value);
    }
    
    // Apply sorting
    const sortValue = sortBy.value;
    filtered.sort((a, b) => {
        switch (sortValue) {
            case 'dueDate':
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium'];
            case 'createdAt':
                return b.createdAt - a.createdAt;
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
    
    return filtered;
}

function filterAndSortHomework() {
    renderHomeworkList();
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

// Handle offline/online status
window.addEventListener('online', () => {
    console.log('App is online');
});

window.addEventListener('offline', () => {
    console.log('App is offline');
});

// Theme Management Functions
let currentThemeMode = 'auto'; // 'light', 'dark', or 'auto'
let currentTheme = 'light'; // The actual applied theme

function initializeTheme() {
    // Check for saved theme preference or default to auto
    const savedThemeMode = localStorage.getItem('themeMode');
    currentThemeMode = savedThemeMode || 'auto';
    
    // Apply the theme
    applyThemeMode(currentThemeMode);
    
    // Set up theme dropdown event listeners
    setupThemeDropdown();
    
    // Auto-switch theme based on time every hour (only for auto mode)
    setInterval(() => {
        if (currentThemeMode === 'auto') {
            const timeBasedTheme = getTimeBasedTheme();
            if (timeBasedTheme !== currentTheme) {
                currentTheme = timeBasedTheme;
                applyTheme(currentTheme);
                updateThemeDisplay();
            }
        }
    }, 60 * 60 * 1000); // Check every hour
}

function getTimeBasedTheme() {
    const hour = new Date().getHours();
    // Dark mode from 7 PM to 7 AM
    return (hour >= 19 || hour < 7) ? 'dark' : 'light';
}

function setupThemeDropdown() {
    if (!themeToggle || !themeDropdown) return;
    
    // Toggle dropdown on button click
    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        themeDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!themeToggle.contains(e.target) && !themeDropdown.contains(e.target)) {
            themeDropdown.classList.remove('show');
        }
    });
    
    // Handle theme option clicks
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const selectedMode = option.dataset.theme;
            applyThemeMode(selectedMode);
            themeDropdown.classList.remove('show');
        });
    });
}

function applyThemeMode(themeMode) {
    currentThemeMode = themeMode;
    
    // Determine the actual theme to apply
    if (themeMode === 'auto') {
        currentTheme = getTimeBasedTheme();
    } else {
        currentTheme = themeMode;
    }
    
    // Apply the theme
    applyTheme(currentTheme);
    updateThemeDisplay();
    
    // Save user preference
    localStorage.setItem('themeMode', themeMode);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
}

function updateThemeDisplay() {
    // Update the main icon based on current theme
    if (themeIcon) {
        updateThemeIcon();
    }
    
    // Update active state in dropdown
    themeOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === currentThemeMode) {
            option.classList.add('active');
        }
    });
}

function updateThemeIcon() {
    if (!themeIcon) return;
    
    // Clear existing content
    themeIcon.innerHTML = '';
    
    if (currentTheme === 'light') {
        // Sun icon for light mode
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        `;
    } else {
        // Moon icon for dark mode
        themeIcon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
    }
}

// Calendar Functions
function setupCalendarEventListeners() {
    if (!calendarBtn || !calendarModal) return;
    
    // Calendar button click
    calendarBtn.addEventListener('click', showCalendar);
    
    // Date input click
    dueDateInput.addEventListener('click', showCalendar);
    
    // Calendar close button
    calendarCloseBtn.addEventListener('click', hideCalendar);
    
    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));
    
    // Calendar footer buttons
    todayBtn.addEventListener('click', selectToday);
    clearDateBtn.addEventListener('click', clearDate);
    
    // Close calendar when clicking overlay
    calendarModal.addEventListener('click', (e) => {
        if (e.target === calendarModal || e.target.classList.contains('calendar-modal-overlay')) {
            hideCalendar();
        }
    });
    
    // Close calendar with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && calendarModal.classList.contains('show')) {
            hideCalendar();
        }
    });
    
    // Initialize calendar
    renderCalendar();
}

function showCalendar() {
    calendarModal.classList.remove('hidden');
    setTimeout(() => {
        calendarModal.classList.add('show');
    }, 10);
    renderCalendar();
}

function hideCalendar() {
    calendarModal.classList.remove('show');
    setTimeout(() => {
        calendarModal.classList.add('hidden');
    }, 300);
}

function navigateMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    if (!calendarMonthYear || !calendarDays) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Update month/year header
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    calendarMonthYear.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Clear previous days
    calendarDays.innerHTML = '';
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const prevMonthDay = new Date(year, month, 0 - (startingDayOfWeek - 1 - i));
        const dayElement = createDayElement(prevMonthDay.getDate(), prevMonthDay, true);
        calendarDays.appendChild(dayElement);
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayElement = createDayElement(day, date, false);
        calendarDays.appendChild(dayElement);
    }
    
    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - (startingDayOfWeek + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
        const nextMonthDay = new Date(year, month + 1, i);
        const dayElement = createDayElement(nextMonthDay.getDate(), nextMonthDay, true);
        calendarDays.appendChild(dayElement);
    }
}

function createDayElement(dayNumber, date, isOtherMonth) {
    const dayElement = document.createElement('button');
    dayElement.className = 'calendar-day';
    dayElement.textContent = dayNumber;
    dayElement.type = 'button';
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    // Check if this is today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
    }
    
    // Check if this is the selected date
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        dayElement.classList.add('selected');
    }
    
    // Add click event
    dayElement.addEventListener('click', () => selectDate(date));
    
    return dayElement;
}

function selectDate(date) {
    selectedDate = new Date(date);
    dueDateInput.value = formatDateForInput(selectedDate);
    hideCalendar();
    renderCalendar(); // Re-render to update selected state
}

function selectToday() {
    selectDate(new Date());
}

function clearDate() {
    selectedDate = null;
    dueDateInput.value = '';
    hideCalendar();
    renderCalendar(); // Re-render to update selected state
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateFromInput(dateString) {
    if (!dateString) return null;
    return new Date(dateString);
}

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

/* ========================================
   ELEGANT CELEBRATION ANIMATION SYSTEM
   ======================================== */

/**
 * Triggers an elegant celebration animation when homework is completed
 * Features: Subtle overlay, animated checkmark, floating particles, success text
 */
function triggerCelebrationAnimation() {
    console.log('🎉 Triggering celebration animation');
    
    // Create celebration overlay
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    document.body.appendChild(overlay);
    
    // Create main checkmark
    const checkmark = document.createElement('div');
    checkmark.className = 'celebration-checkmark';
    document.body.appendChild(checkmark);
    
    // Create success text
    const successText = document.createElement('div');
    successText.className = 'celebration-text';
    successText.textContent = 'Homework Completed!';
    document.body.appendChild(successText);
    
    // Create ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'celebration-ripple';
    ripple.style.top = '50%';
    ripple.style.left = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(ripple);
    
    // Create floating particles
    createFloatingParticles();
    
    // Activate overlay
    setTimeout(() => {
        overlay.classList.add('active');
    }, 50);
    
    // Clean up after animation completes (2s delay + 0.8s fade out)
    setTimeout(() => {
        cleanupCelebrationElements();
    }, 2800);
}

/**
 * Creates minimalistic floating particles around the celebration
 */
function createFloatingParticles() {
    const particleCount = 6;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        
        // Random position around center
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 50 + Math.random() * 30;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        // Random delay for staggered animation
        particle.style.animationDelay = (Math.random() * 0.3) + 's';
        
        document.body.appendChild(particle);
    }
}

/**
 * Cleans up all celebration elements after animation
 */
function cleanupCelebrationElements() {
    const elementsToRemove = [
        '.celebration-overlay',
        '.celebration-checkmark',
        '.celebration-text',
        '.celebration-ripple',
        '.celebration-particle'
    ];
    
    elementsToRemove.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    });
    
    console.log('🧹 Celebration animation cleanup completed');
}
