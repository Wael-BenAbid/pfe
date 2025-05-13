# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Rh_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='usersession',
            name='hours_worked',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
    ]
