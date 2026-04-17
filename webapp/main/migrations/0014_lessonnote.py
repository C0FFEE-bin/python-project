from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0013_merge_0011_notification_0012_user_username_sync"),
    ]

    operations = [
        migrations.CreateModel(
            name="LessonNote",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("subject", models.CharField(max_length=100)),
                ("title", models.CharField(max_length=200)),
                ("content", models.TextField()),
                ("tags", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="lesson_notes",
                        to="main.user",
                    ),
                ),
            ],
            options={
                "db_table": "lesson_note",
                "ordering": ["-updated_at", "-id"],
            },
        ),
    ]
