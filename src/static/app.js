document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Main content
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        participantsSection.appendChild(participantsHeader);

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((p) => {
            const li = document.createElement("li");

            // Create small badge with initials
            const initials = (p.match(/\b\w/g) || []).slice(0,2).join('').toUpperCase();
            const badge = document.createElement("span");
            badge.className = "participant-badge";
            badge.textContent = initials || "S";

            const text = document.createElement("span");
            text.textContent = p;

            li.appendChild(badge);
            li.appendChild(text);

            // Delete/unregister button
            const delBtn = document.createElement("button");
            delBtn.className = "participant-delete";
            delBtn.title = "Unregister participant";
            delBtn.type = "button";
            delBtn.textContent = "✖"; // simple cross icon

            // Click handler to unregister participant
            delBtn.addEventListener("click", async (evt) => {
              evt.preventDefault();
              evt.stopPropagation();

              // Optional confirmation
              const ok = confirm(`Unregister ${p} from ${name}?`);
              if (!ok) return;

              try {
                const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, {
                  method: "DELETE",
                });

                const result = await res.json();
                if (res.ok) {
                  // Refresh the activities list to reflect the change
                  fetchActivities();
                } else {
                  alert(result.detail || result.message || "Failed to unregister participant");
                }
              } catch (error) {
                console.error("Error unregistering participant:", error);
                alert("Failed to unregister participant. Please try again.");
              }
            });

            li.appendChild(delBtn);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          const empty = document.createElement("div");
          empty.className = "participants-empty";
          empty.textContent = "No participants yet. Be the first to sign up!";
          participantsSection.appendChild(empty);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears without a full page reload
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
