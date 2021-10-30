let db;

const request = indexedDB.open('budget-tracker', 1);

// this event will emit if the database version changes 
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;

    db.createObjectStore('new_budget_entry', { autoIncrement: true });
};

// upon success
request.onsuccess = function(event) {
    db = event.target.result;

    // check if app is online
    if (navigator.onLine) {
        uploadBudgetEntry();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// save entry with no internet
function saveEntry(entry) {
    const transaction = db.transaction(['new_budget_entry'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_budget_entry');

    budgetObjectStore.add(entry);
};

function uploadBudgetEntry() {
    const transaction = db.transaction(['new_budget_entry'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_budget_entry');

    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there's data in indexedDB's store send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction = db.transaction(['new_budget_entry'], 'readwrite');

                const budgetObjectStore = transaction.objectStore('new_budget_entry');

                budgetObjectStore.clear();

                alert('All saved transactions have been submitted!')
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadBudgetEntry);