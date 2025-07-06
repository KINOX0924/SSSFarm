use sssmartfarm;
select * from position;
select * from user;
select * from device;
select * from userpreset;
select * from sensordata;
create table position (
	position_id int auto_increment primary key ,
    position_name varchar(50) unique Not null
);
create table user (
	user_id int auto_increment primary key ,
    username varchar(50) unique Not null ,
    password varchar(255) ,
    position_id int
);
create table device (
	device_id bigint auto_increment primary key ,
    position_id int ,
    device_name varchar(100) unique ,
    device_serial varchar(50) unique Not null ,
    location varchar(255) ,
    user_preset_id int ,
    plant_preset_id int ,
    last_active datetime ,
    target_led_state varchar(10) ,
    target_pump_state_1 varchar(10) ,
    target_pump_state_2 varchar(10) ,
    target_fan_state varchar(10) ,
    alert_led_state varchar(10) ,
    override_led_state varchar(10) ,
    override_pump_state_1 varchar(10) ,
    override_pump_state_2 varchar(10) ,
    override_fan_state varchar(10)
);
create table sensordata (
	measure_id bigint auto_increment primary key ,
    device_id bigint Not null ,
    measure_date datetime ,
    temperature float ,
    humidity float ,
    soil_moisture_1 int ,
    soil_moisture_2 int ,
    light_level int ,
    water_level int
);
create table actionlog (
	log_id bigint auto_increment primary key ,
    device_id bigint ,
    action_type varchar(50) Not null ,
    action_trigger varchar(50) Not null ,
    action_time datetime
);
create table plantpreset (
	plant_preset_id int auto_increment primary key ,
    plant_name varchar(100) unique Not null ,
    description text ,
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
    light_end_hour int
);
create table userpreset (
	preset_id int auto_increment primary key ,
    user_id int ,
    preset_name varchar(100) unique Not null ,
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
    light_end_hour int
);
alter table user add constraint fk_user_positionid foreign key (position_id) references position (position_id);
alter table device add constraint fk_device_positionid foreign key (position_id) references position (position_id);
alter table device add constraint fk_device_userpresetid foreign key (user_preset_id) references userpreset (preset_id);
alter table device add constraint fk_device_plantpresetid foreign key (plant_preset_id) references plantpreset (plant_preset_id);
alter table sensordata add constraint fk_sensordata_deviceid foreign key (device_id) references device (device_id);
alter table actionlog add constraint fk_actionlog_deviceid foreign key (device_id) references device (device_id);
alter table userpreset add constraint fk_userpreset_userid foreign key (user_id) references user (user_id);