let membersList = JSON.parse(localStorage.getItem("members")) || [];
let currentEditRow = -1; // using -1 here just to mean "not editing anything yet"

let memberFormEl = document.getElementById("memberForm");
let memberTableBody = document.getElementById("memberTable");

// render whatever is already saved
renderMembers();

memberFormEl.addEventListener("submit", function (evt) {
    evt.preventDefault();
    // grabbing values one by one... a bit repetitive, but it's easy to read later
    let memberName = document.getElementById("name").value.trim();
    let memberEmail = document.getElementById("email").value.trim();
    let memberYear = document.getElementById("year").value.trim();
    let memberAffiliation = document.getElementById("affiliation").value.trim();
    let memberPhone = document.getElementById("phone").value.trim();

    if (memberName === "" || memberEmail === "" || memberYear === "" || memberAffiliation === "") {
        alert("Please fill in all required fields");
        return;
    }

    let memberData = {
        name: memberName,
        email: memberEmail,
        year: memberYear,
        affiliation: memberAffiliation,
        phone: memberPhone
    };

    if (currentEditRow === -1) {
        membersList.push(memberData);
    } else {
        // overwrite the old one if we're editing
        membersList[currentEditRow] = memberData;
        currentEditRow = -1;
    }

    saveMembersToStorage();
    memberFormEl.reset();
    renderMembers();

    // maybe later I could show a little success message here instead of doing nothing
});

function renderMembers() {
    memberTableBody.innerHTML = "";

    if (membersList.length === 0) {
        memberTableBody.innerHTML = "<tr><td colspan='6' class='text-center'>No members added yet</td></tr>";
        return;
    }

    for (let i = 0; i < membersList.length; i++) {
        let item = membersList[i];

        let newRow = "<tr>" +
            "<td>" + item.name + "</td>" +
            "<td>" + item.email + "</td>" +
            "<td>" + item.year + "</td>" +
            "<td>" + item.affiliation + "</td>" +
            "<td>" + (item.phone || "") + "</td>" +
            "<td>" +
                "<button class='btn btn-warning btn-sm' onclick='editMember(" + i + ")'>Edit</button> " +
                "<button class='btn btn-danger btn-sm' onclick='deleteMember(" + i + ")'>Delete</button>" +
            "</td>" +
            "</tr>";

        memberTableBody.innerHTML += newRow;
    }
}

function saveMembersToStorage() {
    localStorage.setItem("members", JSON.stringify(membersList));
}

function deleteMember(index) {
    let confirmDelete = confirm("Remove this member?");
    if (!confirmDelete) {
        return;
    }

    membersList.splice(index, 1);
    saveMembersToStorage();
    renderMembers();

    // edge case: if the user deletes while editing, reset edit mode
    if (currentEditRow === index) {
        currentEditRow = -1;
        memberFormEl.reset();
    }

    // not perfect, but good enough for now
}

function editMember(index) {
    let selectedMember = membersList[index];

    document.getElementById("name").value = selectedMember.name;
    document.getElementById("email").value = selectedMember.email;
    document.getElementById("year").value = selectedMember.year;
    document.getElementById("affiliation").value = selectedMember.affiliation;
    document.getElementById("phone").value = selectedMember.phone;

    currentEditRow = index;

    // could also change the button text to "Update Member" later
    // document.querySelector('button[type="submit"]').textContent = "Update Member";
}
