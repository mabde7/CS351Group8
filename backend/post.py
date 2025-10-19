from dataclasses import dataclass, field
from itertools import count
from typing import List

id_num = count(1) # count the post ids 

def course_helper(value: str) -> str:
    if value is None or not str(value).strip():
        raise ValueError("course is required")
    s = "".join(ch for ch in str(value).upper() if ch.isalnum()) # keep only the alpha numerics 
    i = 0
    # split into the leading letters + numbers 
    while i < len(s) and s[i].isalpha():
        i += 1
    dept, num = s[:i], s[i:]
    # make sure it is in the "cs340" format, or throw the error 
    if not dept or not num.isdigit():
        raise ValueError("invalid course: use letters+digits like 'CS377' or 'MATH210'")
    return f"{dept}{num}"

@dataclass
class Post: # class for different post features, including id, title, the course, content and more
    postID: int # unique id for the post
    title: str # short title for the post
    course: str # asscoiated course for the post 
    content: str # details of the post 
    images: List[str] = field(default_factory=list)
    links:  List[str] = field(default_factory=list)
    tags:   List[str] = field(default_factory=list)

    @classmethod
    def create(cls, title: str, course: str, content: str,images: List[str] | None = None,links: List[str] | None = None,tags: List[str] | None = None) -> "Post":
        if not content.strip():
            raise ValueError("Must include detail of post")

        pid = next(id_num) # assign the unique id to the post 
        return cls( # build the instance 
            postID=pid,
            title=title.strip(),
            course=course_helper(course),
            content=content.strip(),
            images=list(images or []),
            links=list(links or []),
            tags=list(tags or []),
        )
    # update any fields needed 
    def update(self, title: str | None = None, course: str | None = None, content: str | None = None, images: List[str] | None = None, links: List[str] | None = None, tags: List[str] | None = None) -> None:
        if title:
            self.title = title.strip()
        if course:
            self.course = course_helper(course)
        if content:
            if not content.strip():
                raise ValueError("Must include detail of post")
            self.content = content.strip()
        if images is not None:
            self.images = list(images) # replace with a new list 
        if links is not None:
            self.links = list(links)
        if tags is not None:
            self.tags = list(tags)



