
import {useEffect,useState} from "react";

export default function ApprovalPage(){

const[orders,setOrders]=useState([]);

function load(){
fetch("/api/orders")
.then(function(res){return res.json();})
.then(function(data){setOrders(data);});
}

useEffect(load,[]);

function update(id,status){
fetch("/api/orders/"+id,{
method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({status:status})
})
.then(load);
}

return(
<div className="container mt-4">
<h2>Approval</h2>

{orders.map(function(o,i){

if(o.status!=="pending"){return null;}

return(
<div key={i} className="card p-3 mb-2">
{o.name}

<button className="btn btn-success me-2"
onClick={function(){update(o.id,"approved")}}>
Approve
</button>

<button className="btn btn-danger"
onClick={function(){update(o.id,"declined")}}>
Decline
</button>

</div>
);

})}

</div>
);
}
