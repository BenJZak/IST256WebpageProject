$(document).ready(function () {
    var productApiUrl = "http://localhost:3001/api/products";
    var products = [];
    var cart = JSON.parse(localStorage.getItem("cart")) || [];

    function saveCart() {
        localStorage.setItem("cart", JSON.stringify(cart));
    }

    function showMessage(selector, message, type) {
        var box = $(selector);
        box.text(message);
        box.removeClass("d-none alert-success alert-danger alert-info alert-warning");
        box.addClass("alert " + type);
    }

    function hideMessage(selector) {
        $(selector).addClass("d-none");
    }

    function loadProducts() {
        $.ajax({
            url: productApiUrl,
            method: "GET",
            success: function (data) {
                products = data;
                cart = cart.filter(function (item) {
                    return products.some(function (product) {
                        return product.productID === item.productID;
                    });
                });
                saveCart();
                hideMessage("#productMessage");
                displayProducts(products);
                displayCart();
            },
            error: function () {
                products = [];
                displayProducts(products);
                showMessage("#productMessage", "Products could not be loaded. Make sure the Node.js server is running.", "alert-danger");
            }
        });
    }

    function displayProducts(list) {
        $("#productList").empty();

        if (products.length === 0) {
            $("#productList").html("<div class='alert alert-info'>No products are available right now.</div>");
            return;
        }

        if (list.length === 0) {
            $("#productList").html("<div class='alert alert-warning'>No matching products found.</div>");
            return;
        }

        list.forEach(function (product) {
            var card = "<div class='card mb-3'>" +
                "<div class='card-body'>" +
                "<h5 class='card-title'>" + (product.description || "Untitled Product") + "</h5>" +
                "<p><strong>ID:</strong> " + (product.productID || "No ID") + "</p>" +
                "<p><strong>Category:</strong> " + (product.category || "") + "</p>" +
                "<p><strong>Unit:</strong> " + (product.unit || "") + "</p>" +
                "<p><strong>Price:</strong> $" + Number(product.price || 0).toFixed(2) + "</p>" +
                "<p><strong>Weight:</strong> " + (product.weight || "N/A") + "</p>" +
                "<p><strong>Color:</strong> " + (product.color || "N/A") + "</p>" +
                "<button class='btn btn-sm btn-primary addToCart' data-id='" + product.productID + "'>Send to Cart</button>" +
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
                (item.description || "Untitled Product") + " - $" + Number(item.price || 0).toFixed(2) +
                "<button class='btn btn-sm btn-danger float-end removeFromCart' data-index='" + index + "'>Remove</button>" +
                "</div>" +
                "</div>";

            $("#cartList").append(row);
        });
    }

    $("#reloadProducts").on("click", function () {
        loadProducts();
    });

    $("#search").on("keyup", function () {
        var val = $(this).val().toLowerCase();

        var filtered = products.filter(function (product) {
            return (product.description || "").toLowerCase().includes(val) ||
                   (product.category || "").toLowerCase().includes(val) ||
                   (product.productID || "").toLowerCase().includes(val) ||
                   (product.unit || "").toLowerCase().includes(val) ||
                   (product.color || "").toLowerCase().includes(val) ||
                   (product.weight || "").toLowerCase().includes(val);
        });

        displayProducts(filtered);
    });

    $(document).on("click", ".addToCart", function () {
        var id = $(this).data("id");

        var product = products.find(function (item) {
            return item.productID === id;
        });

        if (product) {
            cart.push(product);
            saveCart();
            displayCart();
            hideMessage("#checkoutMessage");
        }
    });

    $(document).on("click", ".removeFromCart", function () {
        var index = $(this).data("index");
        cart.splice(index, 1);
        saveCart();
        displayCart();
    });

    $("#checkout").on("click", function () {
        if (cart.length === 0) {
            showMessage("#checkoutMessage", "Your cart is empty.", "alert-danger");
            return;
        }

        saveCart();
        window.location.href = "/#checkout";
    });

    loadProducts();
    displayCart();
});
