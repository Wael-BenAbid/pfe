# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('Rh_app', '0007_notification'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mission',
            name='supervisor',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='supervised_missions', to='Rh_app.user'),
        ),
    ]
