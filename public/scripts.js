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
        <h4>Select a Date to Save This ${category.charAt(0).toUpperCase() + category.slice(1)} Note:</h4>
        <div id="calendar-${category}"></div>`;
      this.parentNode.appendChild(calendarContainer);
    }

    // Toggle the calendar visibility
    calendarContainer.style.display = calendarContainer.style.display === "none" || calendarContainer.style.display === "" ? "block" : "none";

    // Initialize calendar if not already initialized
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

// Function to handle form submission (save the note)
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
  };

  // Send the note to the backend
  fetch('/api/notes', {
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

      // Add the event to the calendar
      if (selectedDate) {
        const calendar = calendars[category];
        if (calendar) {
          calendar.addEvent({
            title: data.title,
            start: selectedDate, // Display the saved note on the calendar at the selected date
            allDay: true,
          });
        }
      }

      const makeAnotherNote = confirm("Note Saved! Click OK to make another note. Click Cancel to Exit.");
      if (makeAnotherNote) {
        resetToInitialScreen();
      } else {
        exitApp();
      }
    })
    .catch(error => {
      console.error("Error:", error);
      saveMessage.innerText = "Error saving the note.";
    });
}

// Function to clear the form when the discard button is clicked
 function discardForm(category) {
  const userConfirmed = confirm(
          "Are you sure you want to erase the content of this note?"
      );

  if (userConfirmed) {
    // Get the form element based on the category and reset its fields
    const form = document.getElementById(`${category}FormElement`); // Target the correct form ID

    if (form) {
      form.reset(); // Reset the form fields
    }

    // Clear any save message, if displayed
    const saveMessage = document.getElementById("saveMessage");
    if (saveMessage) {
      saveMessage.innerText = "";
    }

    // Hide all forms after the discard action
    const forms = document.querySelectorAll(".dropdown-container");
    forms.forEach((form) => (form.style.display = "none")); // Hide all forms

    // Do not click any tab, leave no form visible
    console.log("Form discarded, all forms hidden");
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

  const selectedDate = document
    .getElementById(`${category}Form`)
    .getAttribute("data-selected-date");

  // Ensure title and content are not empty
  if (!title || !content) {
    alert("Please provide both title and content.");
    return;
  }

  // Create the note object once
  const note = {
    title,
    content,
    category,
    createdAt: selectedDate || new Date().toISOString(), // Use selected date if available
  };

  const saveMessage = document.getElementById("saveMessage");

  // Send the note to the backend
  fetch('http://127.0.0.1:5001/api/notes', {
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
      if (selectedDate) {
        const calendar = FullCalendar.getCalendarById(`calendar-${category}`);
        calendar.addEvent({
          title: data.title,
          start: selectedDate,
        });
      }

      const makeAnotherNote = confirm("Note Saved! Click OK to make another note. Click Cancel to Exit.");
      if (makeAnotherNote) {
        resetToInitialScreen();
      } else {
        exitApp();
      }
    })
    .catch(error => {
      console.error("Error:", error);
      saveMessage.innerText = "Error saving the note.";
    });
}



// Function to reset all forms and return to the initial screen (no forms visible)
function resetToInitialScreen() {
  // Hide all forms
  const formContainers = document.querySelectorAll(".dropdown-container");
  formContainers.forEach((form) => (form.style.display = "none")); // Hide all forms

  // Clear any save message
  const saveMessage = document.getElementById("saveMessage");
  if (saveMessage) {
    saveMessage.innerText = "";
  }

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
