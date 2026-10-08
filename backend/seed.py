"""Seeds one Spanish course, a sample learner with some progress and leaderboard rivals."""
from datetime import date, timedelta
import models
from models import SessionLocal


# --- small helpers to build exercises compactly ---
def mc(prompt, answer, options, emojis=None):
    return ("multiple_choice", prompt, {"options": options, "answer": answer, "emojis": emojis})

def wb(sentence, answer, extra):
    words = answer.split() + extra
    return ("word_bank", "Translate this sentence", {"sentence": sentence, "answer": answer, "words": sorted(words)})

def match(*pairs):
    return ("match_pairs", "Tap the matching pairs", {"pairs": [list(p) for p in pairs]})

def fill(sentence, answer, options):
    return ("fill_blank", "Fill in the blank", {"sentence": sentence, "answer": answer, "options": options})

def typ(sentence, answer):
    return ("type_answer", "Write this in English", {"sentence": sentence, "answer": answer})


COURSE = [
    ("Form basic sentences", "Use basic words and phrases", "#58CC02", [
        ("Basics", "🥚", [
            [mc('Which one of these is "the man"?', "el hombre", ["el hombre", "la mujer", "el niño"], ["👨", "👩", "👦"]),
             wb("I am a man", "Yo soy un hombre", ["mujer", "una", "eres"]),
             match(("hombre", "man"), ("mujer", "woman"), ("niño", "boy"), ("niña", "girl")),
             fill("Yo ___ una mujer.", "soy", ["soy", "eres", "es"]),
             typ("el niño", "the boy")],
            [mc('Which one of these is "the girl"?', "la niña", ["el niño", "la niña", "el hombre"], ["👦", "👧", "👨"]),
             wb("The woman is here", "La mujer está aquí", ["hombre", "es", "allí"]),
             match(("yo", "I"), ("tú", "you"), ("él", "he"), ("ella", "she")),
             fill("Tú ___ un niño.", "eres", ["soy", "eres", "son"]),
             typ("la mujer", "the woman")],
        ]),
        ("Greetings", "👋", [
            [mc('How do you say "hello"?', "hola", ["adiós", "hola", "gracias"], ["👋", "😊", "🙏"]),
             wb("Good morning", "Buenos días", ["noches", "tardes", "Buenas"]),
             match(("hola", "hello"), ("adiós", "goodbye"), ("gracias", "thank you"), ("por favor", "please")),
             fill("Buenas ___, ¿cómo estás?", "tardes", ["tardes", "días", "hola"]),
             typ("gracias", "thank you")],
            [mc('How do you say "goodbye"?', "adiós", ["hola", "adiós", "sí"], ["😊", "👋", "👍"]),
             wb("How are you?", "¿Cómo estás?", ["Qué", "eres", "¿Dónde"]),
             match(("sí", "yes"), ("no", "no"), ("bien", "well"), ("mal", "bad")),
             fill("Estoy muy ___, gracias.", "bien", ["bien", "hola", "adiós"]),
             typ("buenas noches", "good night")],
        ]),
        ("Food", "🍎", [
            [mc('Which one of these is "the apple"?', "la manzana", ["el pan", "la manzana", "el agua"], ["🍞", "🍎", "💧"]),
             wb("I drink water", "Yo bebo agua", ["como", "pan", "leche"]),
             match(("pan", "bread"), ("agua", "water"), ("leche", "milk"), ("queso", "cheese")),
             fill("Ella ___ una manzana.", "come", ["come", "bebe", "es"]),
             typ("el pan", "the bread")],
            [mc('Which one of these is "the milk"?', "la leche", ["la leche", "el queso", "el café"], ["🥛", "🧀", "☕"]),
             wb("I eat bread", "Yo como pan", ["bebo", "agua", "manzana"]),
             match(("café", "coffee"), ("arroz", "rice"), ("huevo", "egg"), ("pollo", "chicken")),
             fill("Nosotros ___ café.", "bebemos", ["bebemos", "comemos", "somos"]),
             typ("la manzana roja", "the red apple")],
        ]),
    ]),
    ("Talk about family", "Describe people and things", "#CE82FF", [
        ("Family", "👪", [
            [mc('Which one of these is "the mother"?', "la madre", ["el padre", "la madre", "el hermano"], ["👨", "👩", "🧒"]),
             wb("My father is tall", "Mi padre es alto", ["madre", "baja", "son"]),
             match(("padre", "father"), ("madre", "mother"), ("hermano", "brother"), ("hermana", "sister")),
             fill("Ella es mi ___.", "hermana", ["hermana", "padre", "hermano"]),
             typ("mi familia", "my family")],
            [mc('Which one of these is "the grandfather"?', "el abuelo", ["el abuelo", "la abuela", "el hijo"], ["👴", "👵", "👦"]),
             wb("I love my family", "Yo amo a mi familia", ["padre", "tu", "es"]),
             match(("hijo", "son"), ("hija", "daughter"), ("abuelo", "grandfather"), ("abuela", "grandmother")),
             fill("Mi ___ tiene diez años.", "hijo", ["hijo", "abuelo", "padre"]),
             typ("la abuela", "the grandmother")],
        ]),
        ("Animals", "🐶", [
            [mc('Which one of these is "the dog"?', "el perro", ["el gato", "el perro", "el pájaro"], ["🐱", "🐶", "🐦"]),
             wb("The cat drinks milk", "El gato bebe leche", ["perro", "come", "agua"]),
             match(("perro", "dog"), ("gato", "cat"), ("pájaro", "bird"), ("pez", "fish")),
             fill("El ___ come pescado.", "gato", ["gato", "pan", "agua"]),
             typ("el perro", "the dog")],
            [mc('Which one of these is "the horse"?', "el caballo", ["la vaca", "el caballo", "el cerdo"], ["🐄", "🐴", "🐷"]),
             wb("I have a dog", "Yo tengo un perro", ["gato", "una", "es"]),
             match(("vaca", "cow"), ("caballo", "horse"), ("cerdo", "pig"), ("oso", "bear")),
             fill("Tengo un ___ grande.", "caballo", ["caballo", "leche", "rojo"]),
             typ("el gato negro", "the black cat")],
        ]),
        ("Colors", "🎨", [
            [mc('Which one of these is "red"?', "rojo", ["azul", "rojo", "verde"], ["🔵", "🔴", "🟢"]),
             wb("The car is blue", "El coche es azul", ["rojo", "son", "casa"]),
             match(("rojo", "red"), ("azul", "blue"), ("verde", "green"), ("amarillo", "yellow")),
             fill("La manzana es ___.", "roja", ["roja", "azul", "negra"]),
             typ("el perro blanco", "the white dog")],
            [mc('Which one of these is "black"?', "negro", ["blanco", "negro", "gris"], ["⚪", "⚫", "🩶"]),
             wb("I like the color green", "Me gusta el color verde", ["azul", "Te", "la"]),
             match(("negro", "black"), ("blanco", "white"), ("gris", "gray"), ("rosa", "pink")),
             fill("El cielo es ___.", "azul", ["azul", "rojo", "negro"]),
             typ("la casa amarilla", "the yellow house")],
        ]),
    ]),
]

ACHIEVEMENTS = [
    ("first_lesson", "First Steps", "Complete your first lesson", "🎓", "lessons", 1),
    ("scholar", "Scholar", "Complete 10 lessons", "📚", "lessons", 10),
    ("wildfire", "Wildfire", "Reach a 3 day streak", "🔥", "streak", 3),
    ("on_fire", "On Fire", "Reach a 7 day streak", "☄️", "streak", 7),
    ("xp_hunter", "XP Hunter", "Earn 100 XP", "⚡", "xp", 100),
    ("sage", "Sage", "Earn 500 XP", "🦉", "xp", 500),
]

RIVALS = [
    ("himani", "Himani", "#FF4B4B", 340), ("kavish", "Kavish", "#FFC800", 210), ("sam", "Sam", "#CE82FF", 180),
    ("priya", "Priya", "#FF9600", 150), ("leo", "Leo", "#58CC02", 95), ("chen", "Chen", "#1CB0F6", 70),
    ("nina", "Nina", "#FF86D0", 40), ("omar", "Omar", "#2B70C9", 15),
]


def seed():
    db = SessionLocal()
    if db.query(models.User).count() > 0:
        db.close()
        return

    course = models.Course(language="Spanish", title="Spanish for English speakers", flag="🇪🇸")
    db.add(course)
    for u_pos, (u_title, u_desc, color, skills) in enumerate(COURSE, 1):
        unit = models.Unit(position=u_pos, title=u_title, description=u_desc, color=color)
        course.units.append(unit)
        for s_pos, (s_title, icon, lessons) in enumerate(skills, 1):
            skill = models.Skill(position=s_pos, title=s_title, icon=icon)
            unit.skills.append(skill)
            for l_pos, exercises in enumerate(lessons, 1):
                lesson = models.Lesson(position=l_pos)
                skill.lessons.append(lesson)
                for e_pos, (etype, prompt, data) in enumerate(exercises, 1):
                    lesson.exercises.append(models.Exercise(position=e_pos, type=etype, prompt=prompt, data=data))
    for key, title, desc, icon, metric, threshold in ACHIEVEMENTS:
        db.add(models.Achievement(key=key, title=title, description=desc, icon=icon, metric=metric, threshold=threshold))
    db.flush()

    # Sample learner: finished the first skill, 3 day streak ending yesterday
    today = date.today()
    me = models.User(id=1, username="learner", display_name="You", avatar_color="#1CB0F6", xp=120,
                     gems=500, hearts=5, streak=3, longest_streak=3, last_active_date=today - timedelta(days=1))
    db.add(me)
    first_skill = db.query(models.Skill).order_by(models.Skill.id).first()
    db.add(models.UserSkillProgress(user_id=1, skill_id=first_skill.id, lessons_completed=2, completed=True))
    for i, lesson in enumerate(first_skill.lessons):
        db.add(models.LessonCompletion(user_id=1, lesson_id=lesson.id, xp_earned=15, mistakes=0,
                                       completed_on=today - timedelta(days=2 - i)))

    for username, name, color, weekly in RIVALS:
        rival = models.User(username=username, display_name=name, avatar_color=color, xp=weekly * 4,
                            streak=5, last_active_date=today)
        db.add(rival)
        db.flush()
        db.add(models.LessonCompletion(user_id=rival.id, lesson_id=1, xp_earned=weekly, completed_on=today))

    db.flush()
    # sample learner already earned these badges (2 lessons, 3 day streak, 120 XP)
    for ach in db.query(models.Achievement).filter(models.Achievement.key.in_(["first_lesson", "wildfire", "xp_hunter"])):
        db.add(models.UserAchievement(user_id=1, achievement_id=ach.id))
    db.commit()
    db.close()


if __name__ == "__main__":
    models.Base.metadata.create_all(bind=models.engine)
    seed()
    print("Database seeded")
