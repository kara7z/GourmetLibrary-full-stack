<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Borrow;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $query = Book::with('category')
            ->withCount([
                'borrows as active_borrows_count' => fn($query) => $query->where('status', 'borrowed'),
            ]);

        if ($request->has('q')) {
            $q = $request->q;

            $query->where(function ($query) use ($q) {
                $query->where('title', 'like', "%$q%")
                    ->orWhere('author', 'like', "%$q%")
                    ->orWhereHas('category', function ($q2) use ($q) {
                        $q2->where('name', 'like', "%$q%");
                    });
            });
        }

        
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        
        if ($request->sort === 'popular') {
            $query->orderBy('borrow_count', 'desc');
        } elseif ($request->sort === 'new') {
            $query->orderBy('publication_date', 'desc');
        }

        $books = $query->paginate(10);

        $books->getCollection()->transform(function ($book) {
            $availableCopies = max($book->total_copies - $book->damaged_quantity - $book->active_borrows_count, 0);
            $book->available_copies = $availableCopies;
            $book->collection_status = $availableCopies > 0 ? 'available' : 'unavailable';

            return $book;
        });

        return response()->json($books);
    }


    public function show(Request $request, Book $book)
    {
        $book->load('category')
            ->loadCount([
                'borrows as active_borrows_count' => fn($query) => $query->where('status', 'borrowed'),
            ]);

        if ($request->boolean('track_view')) {
            $book->increment('consultation_count');
            $book->refresh();
            $book->load('category')
                ->loadCount([
                    'borrows as active_borrows_count' => fn($query) => $query->where('status', 'borrowed'),
                ]);
        }

        $book->available_copies = max($book->total_copies - $book->damaged_quantity - $book->active_borrows_count, 0);
        $book->collection_status = $book->available_copies > 0 ? 'available' : 'unavailable';

        return response()->json($book);
    }


    public function store(Request $request)
    {
        $fields = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'publication_date' => 'nullable|date',
            'category_id' => 'required|exists:categories,id',
            'is_new_arrival' => 'boolean',
            'damaged_quantity' => 'integer|min:0',
            'total_copies' => 'required|integer|min:1',
        ]);

        $book = Book::create($fields);

        return response()->json([
            'message' => 'Book created successfully',
            'book' => $book
        ], 201);
    }


    public function update(Request $request, Book $book)
    {
        $fields = $request->validate([
            'title' => 'sometimes|string|max:255',
            'author' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'publication_date' => 'nullable|date',
            'category_id' => 'exists:categories,id',
            'is_new_arrival' => 'boolean',
            'damaged_quantity' => 'integer|min:0',
            'total_copies' => 'integer|min:1',
        ]);

        $book->update($fields);

        return response()->json([
            'message' => 'Book updated successfully',
            'book' => $book
        ]);
    }


    public function destroy(Book $book)
    {
        $book->delete();

        return response()->json([
            'message' => 'Book deleted successfully'
        ]);
    }
}
