let members = JSON.parse(localStorage.getItem("members")) || [];
let editIndex = -1;

const form = document.getElementById("memberForm");
const table = document.getElementById("memberTable");

displayMembers();

form.addEventListener("submit", function(e) {

    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const year = document.getElementById("year").value;
    const affiliation = document.getElementById("affiliation").value;
    const phone = document.getElementById("phone").value;

    if (name === "" || email === "" || year === "" || affiliation === "") {
        alert("Please fill in all required fields");
        return;
    }

    const member = {
        name,
        email,
        year,
        affiliation,
        phone
    };

    if (editIndex === -1) {

        members.push(member);

    } else {

        members[editIndex] = member;
        editIndex = -1;

    }

    localStorage.setItem("members", JSON.stringify(members));

    form.reset();

    displayMembers();

});

function displayMembers() {

    table.innerHTML = "";

    members.forEach((member, index) => {

        const row = `
<tr>
<td>${member.name}</td>
<td>${member.email}</td>
<td>${member.year}</td>
<td>${member.affiliation}</td>
<td>${member.phone}</td>
<td>
<button class="btn btn-warning btn-sm" onclick="editMember(${index})">Edit</button>
<button class="btn btn-danger btn-sm" onclick="deleteMember(${index})">Delete</button>
</td>
</tr>
`;

        table.innerHTML += row;

    });

}

function deleteMember(index) {

    members.splice(index, 1);

    localStorage.setItem("members", JSON.stringify(members));

    displayMembers();

}

function editMember(index) {

    const member = members[index];

    document.getElementById("name").value = member.name;
    document.getElementById("email").value = member.email;
    document.getElementById("year").value = member.year;
    document.getElementById("affiliation").value = member.affiliation;
    document.getElementById("phone").value = member.phone;

    editIndex = index;

}