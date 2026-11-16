-- Pay details removed: wipe the test pay rates and payroll IDs, and the old setting.
update public.staff set hourly_rate = null, payroll_id = null
 where hourly_rate is not null or payroll_id is not null;
update public.businesses set payroll_settings = payroll_settings - 'pay_details'
 where payroll_settings ? 'pay_details';
