const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const cors = require('cors');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
require('dotenv').config()

const port = process.env.PORT || 5055;

app.use(cors());
app.use(bodyParser.json())
app.use(express.static('admins'));
app.use(fileUpload());


app.get('/', (req, res) => {
    res.send('Hello World!')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f4efe.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    console.log('connection err', err);
    const eventCollection = client.db("assignment-11").collection("services");
    const orderCollection = client.db("assignment-11").collection("orders");
    const reviewCollection = client.db("assignment-11").collection("reviews");
    const adminCollection = client.db("assignment-11").collection("admins");

    app.get('/events', (req, res) => {
        eventCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    })

    app.get('/reviews', (req, res) => {
        reviewCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    })

    app.get('/orders', (req, res) => {
        orderCollection.find()
            .toArray((err, items) => {
                res.send(items)
            })
    })

    app.get('/event/:id', (req, res) => {
        console.log(req.params.id);
        const id = ObjectID(req.params.id);
        eventCollection.find({ _id: id })
            .toArray((err, documents) => {
                res.send(documents[0])
            })
    })

    app.post('/eventsByIds', (req, res) => {
        const eventIds = req.body;
        eventCollection.find({ name: { $in: eventIds } })
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    app.post('/addEvent', (req, res) => {
        const newEvent = req.body;
        console.log('adding new event: ', newEvent);
        eventCollection.insertOne(newEvent)
            .then(result => {
                console.log('inserted count', result.insertedCount);
                res.send(result.insertedCount > 0)
            })
    })

    app.post('/addReview', (req, res) => {
        const newEvent = req.body;
        console.log('adding new review: ', newEvent);
        reviewCollection.insertOne(newEvent)
            .then(result => {
                console.log('inserted count', result.insertedCount);
                res.send(result.insertedCount > 0)
            })
    })

    app.delete('/deleteEvent/:id', (req, res) => {
        console.log(req.params.id);
        const id = ObjectID(req.params.id);
        eventCollection.deleteOne({ _id: id })
            .then(result => {
                console.log(result);
            })
    })

    app.post('/addOrder', (req, res) => {
        const order = req.body;
        orderCollection.insertOne(order)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.post('/addAAdmin', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        console.log(name, email, file);
        file.mv(`${__dirname}/admins/${file.name}`, err => {
            if(err){
                console.log(err);
                return res.status(500).send({msg: 'Failed to upload Image'})
            }
            return res.send({name: file.name, path: `${file.name}`})
        })
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        adminCollection.insertOne({ name, email, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/admins', (req, res) => {
        adminCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({ email: email })
            .toArray((err, admins) => {
                res.send(admins.length > 0);
            })
    })


});





app.listen(process.env.PORT || port)