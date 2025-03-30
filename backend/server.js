require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { fakerDE, fakerFR, fakerEN } = require("@faker-js/faker");
const seedrandom = require("seedrandom");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const getFakerInstance = (language) => {
    switch (language) {
        case "de":
            return fakerDE;
        case "fr":
            return fakerFR;
        default:
            return fakerEN;
    }
};

const generateBooks = (seed, page, language, avgLikes, avgReviews) => {
    const rng = seedrandom(`${seed}-${page}`);
    const faker = getFakerInstance(language);

    faker.seed(rng.int32());

    return Array.from({ length: 20 }, (_, index) => {
        // Round reviews count similarly
        const reviewsCount = Math.round(avgReviews + (Math.random() < (avgReviews % 1) ? 1 : 0));
        
        // For likes, we'll check if avgLikes is fractional and distribute the values accordingly
        const floorLikes = Math.floor(avgLikes);  // Get the whole number part of the avgLikes
        const likesCount = Math.random() < (avgLikes % 1) ? floorLikes + 1 : floorLikes;  // If fractional, randomly choose the next integer

        return {
            index: (page - 1) * 20 + index + 1,
            isbn: `${faker.string.numeric(12)}${index}`, // Appends index to ensure uniqueness

            title: faker.lorem.words(3),
            author: faker.person.fullName(),
            publisher: faker.company.name(),
            language,
            likes: likesCount,   // Updated likes calculation
            reviews: reviewsCount, // Updated reviews calculation
            cover: faker.image.urlPicsumPhotos({ width: 200, height: 300 }), // ✅ Realistic book cover images
            reviewsData: Array.from({ length: reviewsCount }, () => ({
                reviewer: faker.person.fullName(),
                text: faker.lorem.sentence(),
            })),
        };
    });
};



app.get("/books", (req, res) => {
    const seed = req.query.seed || "default";
    const page = parseInt(req.query.page) || 1;
    const language = req.query.language || "en";
    const avgLikes = parseFloat(req.query.likes) || 0;
    const avgReviews = parseFloat(req.query.reviews) || 0;

    const books = generateBooks(seed, page, language, avgLikes, avgReviews);
    res.json(books);
});

app.get("/", (req, res) => {
    res.send("📚 Bookstore API is running...");
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
