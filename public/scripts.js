document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".file-folder-tab");
  const forms = document.querySelectorAll(".dropdown-container");

  // Initially hide all forms
  forms.forEach((form) => (form.style.display = "none"));

  // Add click event listeners to all tabs
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab-id");

      // Hide all forms
      forms.forEach((form) => (form.style.display = "none"));

      // Show the selected form
      const activeForm = document.getElementById(tabId);
      if (activeForm) {
        activeForm.style.display = "block";
      }

      // Remove active class from all tabs and add it to the current tab
      tabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
    });
  });
});


// Function to handle item addition in Grocery List or To-Do List
function addNewItem(event, containerId) {
  const container = document.getElementById(containerId);
  const inputField = event.target;

  // Limit to 30 items max
  if (container.children.length >= 30) {
    alert("You can only add up to 30 items.");
    return;
  }

  // Check if Enter key is pressed and the input is not empty
  if (event.key === "Enter" && inputField.value.trim() !== "") {
    event.preventDefault(); // Prevent form submission on Enter key

    // Create a new item group
    const newItemGroup = document.createElement("div");
    newItemGroup.className = "input-group mb-2";

    // Add checkbox
    const checkboxDiv = document.createElement("div");
    checkboxDiv.className = "input-group-text";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.onchange = function () {
      strikeThrough(this);
    }
    checkboxDiv.appendChild(checkbox);

    // Add input field
    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control";
    input.placeholder = "Add item";
    input.onkeydown = function (e) {
      addNewItem(e, containerId);
    };

    // Append the checkbox and input field to the new item group
    newItemGroup.appendChild(checkboxDiv);
    newItemGroup.appendChild(input);

    // Append the new item group to the container
    container.appendChild(newItemGroup);
  }
}

// Function to strike through text when checkbox is checked
function strikeThrough(checkbox) {
  const inputField = checkbox.parentElement.nextElementSibling;
  inputField.style.textDecoration = checkbox.checked ? "line-through" : "none";
}





const calendars = {}; // Store calendar instances for each category

// Add event listeners to "Save To My Calendar" buttons
document.querySelectorAll(".save-to-calendar-btn").forEach((button) => {
  button.addEventListener("click", function () {
    const category = this.getAttribute("data-category");

    // Use one shared calendar container
    let calendarContainer = this.nextElementSibling;
    if (!calendarContainer || !calendarContainer.classList.contains("calendar-container")) {
      calendarContainer = document.createElement("div");
      calendarContainer.classList.add("calendar-container");
      calendarContainer.innerHTML = `
        <h4>Select a Date</h4>
        <div id="calendar-${category}"></div>
      `;
      this.parentNode.appendChild(calendarContainer);
    }

    // Toggle the calendar visibility (open/close)
    calendarContainer.style.display = calendarContainer.style.display === "none" || calendarContainer.style.display === "" ? "block" : "none";

    // Initialize the calendar if not already initialized
    if (!calendars[category]) {
      calendars[category] = initializeCalendar(`calendar-${category}`, category);
    }
  });
});


// Initialize the calendar for a given category
function initializeCalendar(calendarId, category) {
  const calendarEl = document.getElementById(calendarId);
  if (!calendarEl) {
    console.error(`Element with ID ${calendarId} not found.`);
    return;
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    selectable: true,
    dateClick: function (info) {
      const selectedDate = info.dateStr;
      console.log(`Selected date for ${category}: ${selectedDate}`);

      const formElement = document.getElementById(`${category}Form`);
      if (formElement) {
        formElement.setAttribute("data-selected-date", selectedDate);
      }

      const calendarContainer = calendarEl.parentElement;
      if (calendarContainer) {
        let selectedDateDisplay = calendarContainer.querySelector(".selected-date");
        if (!selectedDateDisplay) {
          selectedDateDisplay = document.createElement("p");
          selectedDateDisplay.classList.add("selected-date");
          calendarContainer.appendChild(selectedDateDisplay);
        }
        selectedDateDisplay.innerText = `Date selected: ${selectedDate}`;
      }
    },
  });
  calendar.render();
  return calendar;
}

function discardForm(category) {
  const userConfirmed = confirm("Are you sure you want to erase the content of this note?");

  if (userConfirmed) {
    // Reload the page to return to the original state
    window.location.reload(); // This will reload the page and clear everything
  } else {
    console.log("Discard action canceled");
  }
}



function handleFormSubmit(event, category) {
  event.preventDefault(); // Prevent default form submission

  let title, content;
  if (category === "grocery" || category === "todo") {
    title = document.getElementById(`${category}ListTitle`).value;
    content = Array.from(document.querySelectorAll(`#${category}Items input[type="text"]`))
                   .map(item => item.value).join(", ");
  } else if (category === "general") {
    title = document.getElementById("generalNoteTitle").value;
    content = document.getElementById("generalNoteContent").value;
  }

  const selectedDate = document.getElementById(`${category}Form`).getAttribute("data-selected-date");

  const saveMessage = document.getElementById("saveMessage");

  if (!title || !content) {
    alert("Please provide both title and content.");
    return;
  }

  // Create the note object
  const note = {
    title,
    content,
    category,
    createdAt: selectedDate || new Date().toISOString(),
    selectedDate: selectedDate || null 
  };

  // Send the note to the backend
  fetch('http://localhost:5001/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Error saving note");
      }
      return response.json();
    })
    .then(data => {
      saveMessage.innerText = "Note saved successfully!";
      console.log("Note saved:", data);

      // Add the event to the calendar if a date is selected
      const calendar = calendars[category];
      if (selectedDate) {
        if (calendar) {
          calendar.addEvent({
            title: data.title,
            start: selectedDate,
            allDay: true
          });
        } else {
          console.log("No calendar found for category, note saved without calendar.");
        }
      }

      // Prompt user to make another note or exit
      const makeAnotherNote = confirm("Note Saved! Click OK to make another note. Click Cancel to Exit.");
      if (makeAnotherNote) {
        resetToInitialScreen();
      } else {
        exitApp();
      }
    })
    .catch(error => {
      console.error("Error:", error);
      saveMessage.innerText = `Error saving the note: ${error.message}`;
    });
}
// Function to reset all forms and return to the initial screen (no forms visible)
// Function to reset the page to the initial state
function resetToInitialScreen() {
  // Reload the current page to reset all fields and UI
  window.location.reload();

  console.log("Reset to initial screen, no forms visible.");
}


// Function to exit the app and display a blank screen with a goodbye message
function exitApp() {
  const userConfirmed = confirm("Are you sure you want to leave this app?");
  if (userConfirmed) {
    // Clear the entire content of the body and show a goodbye message
    document.body.innerHTML =
      '<div style="text-align:center; font-size:24px; margin-top:20%;">Goodbye</div>';
    console.log("User has exited the app");
  } else {
    console.log("Exit action canceled");
  }
}
function fetchAndDisplayNotes() {
  fetch('http://localhost:5001/api/notes') // Your backend API
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      return response.json();
    })
    .then(notes => {
      let notesHtml = `
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Date Created</th>
              <th>Date Saved to Calendar</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="notesTableBody">
      `;

      if (notes.length === 0) {
        notesHtml += `<tr><td colspan="5">No notes found</td></tr>`;
      } else {
        notes.forEach(note => {
          const calendarDate = note.calendarDate
            ? new Date(note.calendarDate).toLocaleDateString()
            : 'Not saved to calendar'; // Check if calendar date exists

          notesHtml += `
            <tr>
              <td>${note.title}</td>
              <td>${note.category}</td>
              <td>${new Date(note.createdAt).toLocaleDateString()}</td>
              <td>${calendarDate}</td> <!-- Display the calendar date -->
              <td>
                <button class="btn btn-primary btn-sm" onclick="editNote('${note._id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteNote('${note._id}')">Delete</button>
              </td>
            </tr>
          `;
        });
      }


      notesHtml += `</tbody></table>`;
      document.getElementById('notes-container').innerHTML = notesHtml; // Render notes in the container
    })
    .catch(error => {
      console.error("Error fetching notes:", error);
      document.getElementById('notes-container').innerHTML = '<p>Error fetching notes.</p>';
    });
}

// Optional functions to edit and delete notes
window.editNote = function(noteId) {
  fetch(`http://localhost:5001/api/notes/${noteId}`)
    .then(response => response.json())
    .then(note => {
      // Prefill the modal with the note data
      document.getElementById('editNoteId').value = note._id;
      document.getElementById('editNoteTitle').value = note.title;
      document.getElementById('editNoteContent').value = note.content;

      // Show the modal
      $('#editNoteModal').modal('show');
    })
    .catch(error => console.error("Error fetching note:", error));
};

window.deleteNote = function(noteId) {
  const userConfirmed = confirm("Are you sure you want to delete this note?");
  if (userConfirmed) {
    fetch(`http://localhost:5001/api/notes/${noteId}`, {
      method: 'DELETE',
    })
    .then(() => {
      // After deleting, refresh the notes list
      fetchAndDisplayNotes();
    })
    .catch(error => console.error("Error deleting note:", error));
  }
};