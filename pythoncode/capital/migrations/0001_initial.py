# Generated by Django 4.2.7 on 2024-10-23 20:51

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('juntas', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CapitalSocial',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reserva_legal', models.FloatField(default=0.0)),
                ('fondo_social', models.FloatField(default=0.0)),
                ('junta', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='juntas.junta')),
            ],
        ),
        migrations.CreateModel(
            name='IngresoCapital',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('Reserva Legal', 'Reserva Legal'), ('Fondo Social', 'Fondo Social')], max_length=255)),
                ('amount', models.FloatField()),
                ('date', models.DateField(auto_now_add=True)),
                ('capital_social', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='capital.capitalsocial')),
            ],
        ),
        migrations.CreateModel(
            name='GastoCapital',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('Reserva Legal', 'Reserva Legal'), ('Fondo Social', 'Fondo Social')], max_length=255)),
                ('amount', models.FloatField()),
                ('description', models.TextField()),
                ('date', models.DateField(auto_now_add=True)),
                ('capital_social', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='capital.capitalsocial')),
            ],
        ),
    ]
