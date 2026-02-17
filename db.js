const {Pool} = require('pg');
const pool = new Pool({user:'postgres',host:'localhost',database:'hospital',password:'fathinaU0237',port:5432});
module.exports=pool;