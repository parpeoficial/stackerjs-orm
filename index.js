if (process.env.NODE_ENV === "dev") 
{
    require("babel-register")({
        plugins: [],
        presets: ["env"]
    });

    module.exports = require("./src/ORM");
}
else 
{
    module.exports = require("./lib/ORM.js");
}
