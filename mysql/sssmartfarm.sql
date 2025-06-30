use sssmartfarm;

create table user (
user_id int Not null auto_increment primary key ,
username varchar(50) Not null unique ,
password varchar(255) Not null , 
position_id int);
create table position (
position_id int Not null auto_increment primary key ,
position_name varchar(20) Not null);
create table device (
device_id bigint Not null auto_increment primary key ,
position_id int ,
device_name varchar(100) Not null Unique ,
device_serial varchar(50) Not null Unique ,
location varchar(255) ,
preset_name varchar(100) ,
last_active datetime);
create table sensordata (
measure_id bigint Not null auto_increment primary key ,
device_id bigint Not null ,
measure_date datetime ,
temperature float ,
humidity float ,
soil_moisture_1 int ,
soil_moisture_2 int ,
light_level int ,
water_level int);
create table actionlog (
log_id bigint Not null auto_increment primary key ,
device_id bigint Not null ,
action_type varchar(50) Not null ,
action_trigger varchar(50) Not null ,
action_time datetime ,
status varchar(20) Not null);
create table plantpreset (
plant_preset_id int Not null auto_increment primary key ,
plant_name varchar(100) Not null Unique ,
preset_description text ,
recomm_temperature_min decimal(5,2) Not null ,
recomm_temperature_max decimal(5,2) Not null ,
recomm_humidity_min decimal(5,2) Not null ,
recomm_humidity_max decimal(5,2) Not null ,
recomm_soil_moisture_1_min int Not null ,
recomm_soil_moisture_1_max int Not null ,
recomm_soil_moisture_2_min int Not null ,
recomm_soil_moisture_2_max int Not null ,
darkness_threshold int Not null ,
led_level int ,
light_start_hour int ,
light_end_hour int);
create table userpreset (
preset_id int Not null auto_increment primary key ,
user_id int ,
preset_name varchar(100) Not null Unique ,
target_temperature_min decimal(5,2) Not null ,
target_temperature_max decimal(5,2) Not null ,
target_humidity_min decimal(5,2) Not null ,
target_humidity_max decimal(5,2) Not null ,
target_soil_moisture_1_min int Not null ,
target_soil_moisture_1_max int Not null ,
target_soil_moisture_2_min int Not null ,
target_soil_moisture_2_max int Not null ,
darkness_threshold int Not null ,
led_level int ,
light_start_hour int ,
light_end_hour int);

alter table device
add constraint fk_device_positionid
foreign key (position_id)
references position (position_id)
on update cascade
on delete restrict;

alter table user
add constraint fk_user_positionid
foreign key (position_id)
references position (position_id)
on update cascade
on delete restrict;

alter table userpreset
add constraint fk_userpreset_userid
foreign key (user_id)
references user(user_id)
on update cascade
on delete restrict;

alter table device
add constraint fk_device_presetname_1
foreign key (preset_name)
references userpreset(preset_name)
on update cascade
on delete restrict;

alter table device
add constraint fk_device_presetname_2
foreign key (preset_name)
references plantpreset(plant_name)
on update cascade
on delete restrict;

alter table sensordata
add constraint fk_sensordata_deviceid
foreign key (device_id)
references device(device_id)
on update cascade
on delete restrict;

alter table actionlog
add constraint fk_actionlog_deviceid
foreign key (device_id)
references device(device_id)
on update cascade
on delete restrict;