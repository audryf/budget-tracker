// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget-tracker' and set it to version 1
const request = indexedDB.open('budget-tracker', 1);

// this event will emit if the database version changes 
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;

    // create an object store (table) called 'budget-tracker', set it to have an autoincrementing 'primary key'
    db.createObjectStore('new_budget_entry', { autoIncrement: true });
};

// upon success
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradeneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadBudgetEntry() function to send all local db data to api
    if (navigator.onLine) {
        // haven't created this yet
        uploadBudgetEntry();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit a new budget entry with no internet connection
function saveEntry(entry) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_budget_entry'], 'readwrite');

    // access the object store for 'new_budget_entry'
    const budgetObjectStore = transaction.objectStore('new_budget_entry');

    // add record to store with add method
    budgetObjectStore.add(entry);
};

function uploadBudgetEntry() {
    // open a transaction on the db
    const transaction = db.transaction(['new_budget_entry'], 'readwrite');

    // access your object store
    const budgetObjectStore = transaction.objectStore('new_budget_entry');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon a successful .getAll execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDB's store, let's send it to the ap server
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
                // open one more transaction
                const transaction = db.transaction(['new_budget_entry'], 'readwrite');
                // access the new_budget_entry object store
                const budgetObjectStore = transaction.objectStore('new_budget_entry');
                // clear all items in the store
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