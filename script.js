let membersList = JSON.parse(localStorage.getItem("members")) || [];
let currentEditRow = -1;

let memberFormEl = document.getElementById("memberForm");
let memberTableBody = document.getElementById("memberTable");

renderMembers();

memberFormEl.addEventListener("submit", function (evt) {
    evt.preventDefault();

    let memberName = document.getElementById("name").value.trim();
    let memberEmail = document.getElementById("email").value.trim();
    let memberYear = document.getElementById("year").value.trim();
    let memberAffiliation = document.getElementById("affiliation").value.trim();
    let memberPhone = document.getElementById("phone").value.trim();

    if (memberName === "" || memberEmail === "" || memberYear === "" || memberAffiliation === "") {
        alert("Please fill in all required fields");
        return;
    }

    let emailPattern = /[a-zA-Z0-9._-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*/;

    if (!emailPattern.test(memberEmail)) {
        alert("Please enter a valid email address");
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
        membersList[currentEditRow] = memberData;
        currentEditRow = -1;
    }

    saveMembersToStorage();
    memberFormEl.reset();
    renderMembers();

    document.querySelector('button[type="submit"]').textContent = "Add Member";
    alert("Member successfully saved!");
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
    let confirmDelete = confirm("Remove this member");
    if (!confirmDelete) {
        return;
    }

    membersList.splice(index, 1);
    saveMembersToStorage();
    renderMembers();

    if (currentEditRow === index) {
        currentEditRow = -1;
        memberFormEl.reset();
        document.querySelector('button[type="submit"]').textContent = "Add Member";
    }
}

function editMember(index) {
    let selectedMember = membersList[index];

    document.getElementById("name").value = selectedMember.name;
    document.getElementById("email").value = selectedMember.email;
    document.getElementById("year").value = selectedMember.year;
    document.getElementById("affiliation").value = selectedMember.affiliation;
    document.getElementById("phone").value = selectedMember.phone;

    currentEditRow = index;
    document.querySelector('button[type="submit"]').textContent = "Update Member";
}
