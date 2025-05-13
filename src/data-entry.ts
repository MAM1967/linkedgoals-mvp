// Get references to the form and input elements
const goalForm = document.getElementById('goalForm') as HTMLFormElement;
const specificInput = document.getElementById('specific') as HTMLTextAreaElement;
const measurableTypeSelect = document.getElementById('measurable-type') as HTMLSelectElement;
// We need to get references to the potentially different measurable inputs
const measurableTargetNumberInput = document.getElementById('measurable-target-number') as HTMLInputElement;
const measurableNumberInputsContainer = document.getElementById('measurable-number-inputs') as HTMLDivElement;
const measurableCurrentNumberInput = document.getElementById('measurable-current-number') as HTMLInputElement;
const measurableTargetDateInput = document.getElementById('measurable-target-date') as HTMLInputElement;
const measurableDateInputsContainer = document.getElementById('measurable-date-inputs') as HTMLDivElement;
const measurableBooleanInputsContainer = document.getElementById('measurable-boolean-inputs') as HTMLDivElement;
const measurableCurrentStatusCheckbox = document.getElementById('measurable-current-status') as HTMLInputElement;
const achievableInput = document.getElementById('achievable') as HTMLTextAreaElement;
const relevantInput = document.getElementById('relevant') as HTMLTextAreaElement;
const timeBoundInput = document.getElementById('time-bound') as HTMLInputElement;
const saveButton = document.getElementById('save-button') as HTMLButtonElement;
const cancelButton = document.getElementById('cancel-button') as HTMLButtonElement;

// Function to read input values
function getGoalData() {
    const goalData = {
        specific: specificInput.value,
        measurableType: measurableTypeSelect.value,
        measurableTarget: null as string | number | boolean | null,
        measurableCurrent: null as string | number | boolean | null,
        achievable: achievableInput.value,
        relevant: relevantInput.value,
        timeBound: timeBoundInput.value,
    };
    // Read the appropriate measurable values based on the selected type
    const measurableType = measurableTypeSelect.value;
    if (measurableType === 'Number') {
        goalData.measurableTarget = parseFloat(measurableTargetNumberInput.value);
        goalData.measurableCurrent = parseFloat(measurableCurrentNumberInput.value);
    } else if (measurableType === 'Date') {
        goalData.measurableTarget = measurableTargetDateInput.value;
        // For date type, measurableCurrent could be the current date or last check-in date
        goalData.measurableCurrent = new Date().toISOString().split('T')[0]; // Using current date as placeholder
    } else if (measurableType === 'Yes/No') {
        goalData.measurableTarget = true; // Target is always true for Yes/No
        goalData.measurableCurrent = measurableCurrentStatusCheckbox.checked;
    }
    return goalData;
}

// Function to validate input data
function validateGoalData(goalData: any): boolean {
    if (!goalData.specific) {
        alert('Please provide a specific goal.');
        return false;
    }
    if (!goalData.measurableType) {
        alert('Please select a measurable type.');
        return false;
    }

    // Validate measurable based on type
    switch (goalData.measurableType) {
        case 'Number':
            if (goalData.measurableTarget === null || isNaN(goalData.measurableTarget) || goalData.measurableTarget === undefined) {
                alert('Please provide a valid target number for your goal.');
                return false;
            }
            break;
        case 'Date':
            if (!goalData.measurableTarget) {
                alert('Please provide a target date for your goal.');
                return false;
            }
            break;
    }
    if (!goalData.relevant) {
        alert('Please describe why your goal is relevant.');
        return false;
    }
    if (!goalData.timeBound || goalData.timeBound === '') {
        alert('Please provide a deadline for your goal.');
        return false;
    }
     if (!goalData.achievable) {
        alert('Please describe why your goal is achievable.');
        return false;
    }
    return true; // Indicate validation success
}

// Event listener for form submission
goalForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent default form submission

    const goalData = getGoalData();
    console.log('Goal data to be validated:', goalData);

    if (validateGoalData(goalData)) {
        console.log('Goal data is valid, submitting:', goalData);

        // Structure the data according to the schema
        const smartGoalData = {
            specific: goalData.specific,
            measurable: {
                type: goalData.measurableType,
                targetValue: goalData.measurableTarget,
                currentValue: goalData.measurableCurrent,
            },
            achievable: goalData.achievable,
            relevant: goalData.relevant,
            timeBound: goalData.timeBound,
            userId: 'placeholder_user_id', // Replace with actual user ID
            creationDate: new Date().toISOString(),
            lastUpdatedDate: new Date().toISOString(),
        };

        // Send data to the Cloud Function
        const cloudFunctionUrl = 'https://us-central1-linkedgoals-d7053.cloudfunctions.net/saveSmartGoal';

        fetch(cloudFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(smartGoalData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Goal saved successfully:', data);
            // You can add logic here to redirect the user or show a success message
        })
        .catch(error => {
            console.error('Error saving goal:', error);
            // You can display an error message to the user here
        });
    }
});

// Event listener for Cancel button click
cancelButton.addEventListener('click', () => {
    console.log('Cancel button clicked');
    // Here you would typically clear the form or navigate away
    goalForm.reset(); // Clear the form
});

// You'll need to add logic here to dynamically show/hide the measurable target/current inputs
// based on the measurableTypeSelect value. This will involve listening to the 'change' event
// on the measurableTypeSelect element and modifying the DOM.