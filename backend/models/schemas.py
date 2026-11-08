from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class APIModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ProfileUpdate(APIModel):
    name: str | None = Field(default=None, max_length=120)
    title: str | None = Field(default=None, max_length=160)
    introduction: str | None = Field(default=None, max_length=2000)
    email: str | None = Field(default=None, max_length=320)
    location: str | None = Field(default=None, max_length=160)
    linkedIn: str | None = Field(default=None, max_length=2048)
    github: str | None = Field(default=None, max_length=2048)


class SkillCreate(APIModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(default="General", min_length=1, max_length=100)


class SkillUpdate(APIModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    category: str | None = Field(default=None, min_length=1, max_length=100)


class ProjectCreate(APIModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    category: str = Field(default="Other", min_length=1, max_length=100)
    image_url: str | None = Field(default=None, max_length=2048)
    image_alt: str | None = Field(default=None, max_length=500)
    technologies: list[str] = Field(default_factory=list, max_length=50)
    github_url: str | None = Field(default=None, max_length=2048)
    demo_url: str | None = Field(default=None, max_length=2048)


class ProjectUpdate(APIModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    image_url: str | None = Field(default=None, max_length=2048)
    image_alt: str | None = Field(default=None, max_length=500)
    technologies: list[str] | None = Field(default=None, max_length=50)
    github_url: str | None = Field(default=None, max_length=2048)
    demo_url: str | None = Field(default=None, max_length=2048)


class EducationCreate(APIModel):
    degree: str = Field(min_length=1, max_length=200)
    institution: str = Field(min_length=1, max_length=200)
    specialization: str = Field(default="", max_length=200)
    start_year: str = Field(min_length=1, max_length=50)
    end_year: str = Field(min_length=1, max_length=50)


class EducationUpdate(APIModel):
    degree: str | None = Field(default=None, min_length=1, max_length=200)
    institution: str | None = Field(default=None, min_length=1, max_length=200)
    specialization: str | None = Field(default=None, max_length=200)
    start_year: str | None = Field(default=None, min_length=1, max_length=50)
    end_year: str | None = Field(default=None, min_length=1, max_length=50)


AchievementType = Literal[
    "Certificate",
    "Hackathon",
    "Award",
    "Competition",
    "Workshop",
    "Course",
]


class AchievementCreate(APIModel):
    type: AchievementType
    title: str = Field(min_length=1, max_length=200)
    organization: str = Field(default="", max_length=200)
    details: str = Field(default="", max_length=2000)
    year: str = Field(default="", max_length=50)


class AchievementUpdate(APIModel):
    type: AchievementType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    organization: str | None = Field(default=None, max_length=200)
    details: str | None = Field(default=None, max_length=2000)
    year: str | None = Field(default=None, max_length=50)


class MessageCreate(APIModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr = Field(max_length=320)
    subject: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=10, max_length=5000)
    company_website: str = Field(default="", max_length=500)


class MessageUpdate(APIModel):
    is_read: bool


class ContactSubmission(APIModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr = Field(max_length=320)
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)
    company_website: str = Field(default="", max_length=500)

    @field_validator("subject")
    @classmethod
    def subject_must_not_contain_line_breaks(cls, value: str) -> str:
        if "\r" in value or "\n" in value:
            raise ValueError("Subject must be a single line.")
        return value
