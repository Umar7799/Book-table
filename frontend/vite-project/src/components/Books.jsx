import React, { useState, useEffect, useRef, useCallback } from "react";
import Papa from 'papaparse';  // Import PapaParse

const Books = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [seed, setSeed] = useState(42);
    const [language, setLanguage] = useState("en");
    const [likes, setLikes] = useState(3.5);
    const [reviews, setReviews] = useState(2.7);
    const [expandedBook, setExpandedBook] = useState(null);
    const prevPageRef = useRef(0);

    const fetchBooks = useCallback(async (currentPage) => {
        if (loading || !hasMore || prevPageRef.current === currentPage) return;
        setLoading(true);

        try {
            const res = await fetch(
                `https://book-table-ac40.onrender.com/books?seed=${seed}&page=${currentPage}&language=${language}&likes=${likes}&reviews=${reviews}`
              );
            const data = await res.json();

            if (data.length === 0) {
                setHasMore(false);
            } else {
                setBooks((prev) => [...prev, ...data]);
                prevPageRef.current = currentPage;
            }
        } catch (error) {
            console.error("Error fetching books:", error);
        }

        setLoading(false);
    }, [seed, language, likes, reviews, loading, hasMore]);

    useEffect(() => {
        setBooks([]);
        setPage(1);
        setHasMore(true);
        prevPageRef.current = 0;
    }, [seed, language, likes, reviews]);

    useEffect(() => {
        fetchBooks(page);
    }, [page, fetchBooks]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && hasMore && !loading) {
                setPage((prevPage) => prevPage + 1);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [hasMore, loading]);

    const toggleExpand = (isbn) => {
        setExpandedBook(expandedBook === isbn ? null : isbn);
    };

    // Function to export books to CSV using PapaParse
    const exportCSV = () => {
        try {
            // Use PapaParse to convert books data to CSV format
            const csv = Papa.unparse(books);  // Convert books array to CSV string
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "books.csv");
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error exporting CSV:', err);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">📚 Book List</h1>

            {/* Add the Export to CSV Button */}
            <button 
                onClick={exportCSV} 
                className="bg-blue-500 text-white py-2 px-4 rounded mb-4"
            >
                Export to CSV
            </button>

            <div className="mb-4 flex gap-4">
                <label>
                    Seed:{" "}
                    <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} className="border p-1" />
                </label>

                <label>
                    Language:
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border p-1">
                        <option value="en">English</option>
                        <option value="de">German</option>
                        <option value="fr">French</option>
                    </select>
                </label>

                <label>
                    Likes:{" "}
                    <input type="number" step="0.1" min="0" max="10" value={likes} onChange={(e) => setLikes(Number(e.target.value))} className="border p-1" />
                </label>

                <label>
                    Reviews:{" "}
                    <input type="number" step="0.1" min="0" max="10" value={reviews} onChange={(e) => setReviews(Number(e.target.value))} className="border p-1" />
                </label>
            </div>

            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-2">Index</th>
                        <th className="border p-2">ISBN</th>
                        <th className="border p-2">Title</th>
                        <th className="border p-2">Author</th>
                        <th className="border p-2">Publisher</th>
                        <th className="border p-2">Likes</th>
                        <th className="border p-2">Reviews</th>
                        <th className="border p-2">Expand</th>
                    </tr>
                </thead>
                <tbody>
                    {books.map((book, index) => (
                        <React.Fragment key={book.isbn}>
                            <tr className="border text-center hover:bg-gray-100 cursor-pointer" onClick={() => toggleExpand(book.isbn)}>
                                <td className="border p-2">{index + 1}</td>
                                <td className="border p-2">{book.isbn}</td>
                                <td className="border p-2">{book.title}</td>
                                <td className="border p-2">{book.author}</td>
                                <td className="border p-2">{book.publisher}</td>
                                <td className="border p-2">{book.likes}</td>
                                <td className="border p-2">{book.reviews}</td>
                                <td className="border p-2">🔽</td>
                            </tr>

                            {expandedBook === book.isbn && (
                                <tr className="border">
                                    <td colSpan="8" className="p-4 text-left bg-gray-50">
                                        <div className="flex gap-4">
                                            <img src={book.cover || "https://via.placeholder.com/150"} alt={book.title} className="w-32 h-48 border" />
                                            <div>
                                                <h3 className="font-bold">{book.title}</h3>
                                                <p><strong>Author:</strong> {book.author}</p>
                                                <p><strong>Publisher:</strong> {book.publisher}</p>
                                                <p><strong>Language:</strong> {book.language.toUpperCase()}</p>
                                                <h4 className="mt-2 font-semibold">Reviews:</h4>
                                                {book.reviewsData?.length > 0 ? (
                                                    book.reviewsData.map((review, idx) => (
                                                        <p key={idx}><strong>{review.reviewer}:</strong> {review.text}</p>
                                                    ))
                                                ) : (
                                                    <p>No reviews available.</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            {loading && <p className="text-center mt-4 animate-pulse">Loading more books...</p>}
            {!hasMore && <p className="text-center mt-4 text-gray-500">No more books available.</p>}
        </div>
    );
};

export default Books;
