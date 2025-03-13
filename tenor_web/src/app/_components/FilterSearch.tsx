import {type ChangeEvent, useState} from 'react';

interface FilterSearchProps {
  list: string[];
  onSearch: (searchTerm: string[]) => void;
}

export function FilterSearch({list, onSearch}: FilterSearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    if (query === "") {
      onSearch(list);
    } else {
      const filtered = list.filter((item) => item.toLowerCase().includes(query));
      onSearch(filtered);
    }
  };

  return (
    <input
      type="text"
      value={searchQuery}
      onChange={handleSearch}
      placeholder="Search projects..."
      className="search-bar"
    />
  )
};
