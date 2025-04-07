import {type ChangeEvent, useState} from 'react';
import Image from "next/image";

interface FilterSearchProps {
  list: string[];
  placeholder: string
  onSearch: (searchTerm: string[]) => void;
}

export function FilterSearch({list, onSearch, placeholder}: FilterSearchProps) {
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
    <div className="self-center h-full relative w-full max-w-[380px]">
      {/* Search Icon */}
      <Image
        src="/search_icon.png"
        alt="Search"
        width={16}
        height={16}
        className="absolute left-2 top-1/2 transform -translate-y-1/2"
      />
      
      {/* Input Field */}
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearch}
        placeholder={placeholder}
        className="pl-8 text-[#59636E] h-full w-full border-2 py-[3px] rounded-md"
      />
    </div>
  )
};
