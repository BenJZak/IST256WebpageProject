$(document).ready(function () {

    var products = JSON.parse(localStorage.getItem("products")) || [
        {
            productID: "P1",
            description: "IST 256 Hoodie",
            category: "Apparel",
            unit: "Each",
            price: 35.00,
            weight: "1 lb",
            color: "Navy"
        },
        {
            productID: "P2",
            description: "Blue Team Workshop CTF Ticket",
            category: "Event",
            unit: "Ticket",
            price: 15.00,
            weight: "",
            color: ""
        }
    ];

    var cart = [];

    function saveProducts() {
        localStorage.setItem("products", JSON.stringify(products));
    }

    function generateProductID() {
        if (products.length === 0) {
            return "P1";
        }

        var highestNum = 0;

        products.forEach(function (product) {
            var currentNum = parseInt(product.productID.replace("P", ""));

            if (currentNum > highestNum) {
                highestNum = currentNum;
            }
        });

        return "P" + (highestNum + 1);
    }

    function setNextProductID() {
        $("#productID").val(generateProductID());
    }

    function displayProducts(list) {
        $("#productList").empty();

        if (list.length === 0) {
            $("#productList").html("<div class='alert alert-warning'>No matching products found.</div>");
            return;
        }

        list.forEach(function (product) {
            var card = "<div class='card mb-3'>" +
                "<div class='card-body'>" +
                "<h5 class='card-title'>" + product.description + "</h5>" +
                "<p><strong>ID:</strong> " + product.productID + "</p>" +
                "<p><strong>Category:</strong> " + product.category + "</p>" +
                "<p><strong>Unit:</strong> " + product.unit + "</p>" +
                "<p><strong>Price:</strong> $" + product.price.toFixed(2) + "</p>" +
                "<p><strong>Weight:</strong> " + (product.weight || "N/A") + "</p>" +
                "<p><strong>Color:</strong> " + (product.color || "N/A") + "</p>" +
                "<button class='btn btn-sm btn-primary addToCart' data-id='" + product.productID + "'>Add to Cart</button>" +
                "</div>" +
                "</div>";

            $("#productList").append(card);
        });
    }

    function displayCart() {
        $("#cartList").empty();

        if (cart.length === 0) {
            $("#cartList").html("<div class='alert alert-secondary'>Cart is empty</div>");
            return;
        }

        cart.forEach(function (item, index) {
            var row = "<div class='card mb-2'>" +
                "<div class='card-body'>" +
                item.description + " - $" + item.price.toFixed(2) +
                "<button class='btn btn-sm btn-danger float-end removeFromCart' data-index='" + index + "'>Remove</button>" +
                "</div>" +
                "</div>";

            $("#cartList").append(row);
        });
    }

    function displayJSON() {
        $("#jsonOutput").text(JSON.stringify(products, null, 2));
    }

    function showCheckoutMessage(message, type) {
        var box = $("#checkoutMessage");
        box.text(message);
        box.removeClass("d-none alert-success alert-danger");
        box.addClass("alert " + type);
    }

    $("#productForm").on("submit", function (evt) {
        evt.preventDefault();

        if (!this.checkValidity()) {
            this.reportValidity();
            return;
        }

        var newProduct = {
            productID: $("#productID").val().trim(),
            description: $("#description").val().trim(),
            category: $("#category").val(),
            unit: $("#unit").val(),
            price: Number($("#price").val()),
            weight: $("#weight").val().trim(),
            color: $("#color").val().trim()
        };

        products.push(newProduct);
        saveProducts();

        this.reset();
        setNextProductID();
        displayProducts(products);
        displayJSON();
    });

    $("#clearBtn").on("click", function () {
        setTimeout(function () {
            setNextProductID();
        }, 0);
    });

    $("#search").on("keyup", function () {
        var val = $(this).val().toLowerCase();

        var filtered = products.filter(function (p) {
            return p.description.toLowerCase().includes(val) ||
                   p.category.toLowerCase().includes(val) ||
                   p.productID.toLowerCase().includes(val) ||
                   p.unit.toLowerCase().includes(val) ||
                   (p.color && p.color.toLowerCase().includes(val)) ||
                   (p.weight && p.weight.toLowerCase().includes(val));
        });

        displayProducts(filtered);
    });

    $(document).on("click", ".addToCart", function () {
        var id = $(this).data("id");

        var product = products.find(function (p) {
            return p.productID === id;
        });

        if (product) {
            cart.push(product);
            displayCart();
        }
    });

    $(document).on("click", ".removeFromCart", function () {
        var index = $(this).data("index");
        cart.splice(index, 1);
        displayCart();
    });

    $("#checkout").on("click", function () {
        if (cart.length === 0) {
            showCheckoutMessage("Your cart is empty.", "alert-danger");
            return;
        }

        $.ajax({
            url: "https://jsonplaceholder.typicode.com/posts",
            method: "POST",
            data: JSON.stringify(cart),
            contentType: "application/json",
            success: function (response) {
                console.log("Success:", response);
                showCheckoutMessage("Cart sent successfully!", "alert-success");
            },
            error: function (xhr, status, error) {
                console.error("AJAX Error:", status, error);
                showCheckoutMessage("Error sending cart. Please try again.", "alert-danger");
            }
        });
    });

    setNextProductID();
    displayProducts(products);
    displayCart();
    displayJSON();
});

