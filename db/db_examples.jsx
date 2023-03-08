db.each('SELECT id_brand FROM catalog_brand WHERE id_brand in ($1:csv)', [ids], cat=> {
    cat.id_brand = parseInt(cat.id_brand)
})
.then(rows => {
    // id_brand is now an integer in each row
});