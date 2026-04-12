
import {useEffect,useState} from "react";

export default function OrderHistoryPage(){

const[orders,setOrders]=useState([]);

useEffect(function(){
fetch("/api/orders")
.then(function(res){return res.json();})
.then(function(data){setOrders(data);});
},[]);

return(
<div className="container mt-4">
<h2>Order History</h2>

{orders.map(function(o,i){
return(
<div key={i} className="card p-3 mb-2">
{o.name} - {o.status}
</div>
);
})}

</div>
);
}
