import {useSearchParams, useNavigate} from 'react-router';

export function CollectionSort() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentSort = searchParams.get('sort') || 'COLLECTION_DEFAULT';

  const sortOptions = [
    {value: 'COLLECTION_DEFAULT', label: 'Featured'},
    {value: 'BEST_SELLING', label: 'Best Selling'},
    {value: 'PRICE', label: 'Price: Low to High'},
    {value: 'PRICE_REVERSE', label: 'Price: High to Low'},
    {value: 'TITLE', label: 'A-Z'},
    {value: 'TITLE_REVERSE', label: 'Z-A'},
  ];

  const handleSortChange = (sortValue) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (sortValue === 'COLLECTION_DEFAULT') {
      newSearchParams.delete('sort');
    } else {
      newSearchParams.set('sort', sortValue);
    }

    // Reset pagination when sort changes
    newSearchParams.delete('startCursor');
    newSearchParams.delete('endCursor');

    navigate(`?${newSearchParams.toString()}`, {replace: true});
  };

  return (
    <div className="collection-sort">
      <label htmlFor="sort-select" className="sort-label">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="sort-select"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
