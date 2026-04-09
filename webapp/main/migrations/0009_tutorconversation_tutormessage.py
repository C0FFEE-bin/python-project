import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0008_replace_observation_notes_with_tutor_follows"),
    ]

    operations = [
        migrations.CreateModel(
            name="TutorConversation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tutor_conversations",
                        to="main.user",
                    ),
                ),
                (
                    "tutor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversations",
                        to="main.tutor",
                    ),
                ),
            ],
            options={
                "db_table": "tutor_conversation",
                "ordering": ["-updated_at", "-id"],
            },
        ),
        migrations.CreateModel(
            name="TutorMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("body", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="main.tutorconversation",
                    ),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sent_tutor_messages",
                        to="main.user",
                    ),
                ),
            ],
            options={
                "db_table": "tutor_message",
                "ordering": ["created_at", "id"],
            },
        ),
        migrations.AddConstraint(
            model_name="tutorconversation",
            constraint=models.UniqueConstraint(
                fields=("tutor", "student"),
                name="unique_tutor_conversation_per_student",
            ),
        ),
    ]
