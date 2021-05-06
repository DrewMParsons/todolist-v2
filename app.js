//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const uri = "mongodb+srv://drewP:drewahf74@cluster0-vu190.mongodb.net/todolistDB";
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Connections
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
// mongoose.set('useFindAndModify', false);

// Schemas

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

//Models

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

// Defaults
const item1 = new Item({
  name: "These are you list items "
});
const item2 = new Item({
  name: "Click square on left to delete"
});
const item3 = new Item({
  name: "Add new items on line below"
});
const defaultItems = [item1, item2, item3];

// This will check to see if the item collection is empty
//if empty: add 3 default items and refresh(redirect) page
app.get("/", function(req, res) {
  Item.find({}, function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Defaults Successfully loaded");
        };
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: items
      });
    }
  });
});

app.get("/:listName", function(req, res) {
  const customListName = _.capitalize(req.params.listName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        console.log("Doesnt exist");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        console.log("exists!");
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.post("/", function(req, res) {
  const listName = req.body.list;
  const itemName = req.body.newItem;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName},function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log(checkedItemId + "  removed");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      function(err,foundList){
        if(!err){
          res.redirect("/"+ listName);
        }
      });
  };
});


app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
};

app.listen(port, function() {
  console.log("Server started on port " + port);
});
